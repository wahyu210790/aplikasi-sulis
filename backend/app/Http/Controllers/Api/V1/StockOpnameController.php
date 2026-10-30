<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Enums\OpnameStatus;
use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Opname\ListStockOpnamesRequest;
use App\Http\Requests\Opname\RejectStockOpnameRequest;
use App\Http\Requests\Opname\StoreStockOpnameRequest;
use App\Http\Requests\Opname\UpdateStockOpnameItemsRequest;
use App\Http\Resources\StockOpnameResource;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Services\AuditLogger;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use App\Support\Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Stock opname (docs/desain-v2.md B5.5, B6, decision H7).
 * Gudang/Owner: create, save counts, submit, cancel. Owner: post (approve) or reject. Finance: view only.
 * Gudang may see system quantities while counting. No money in any response (StockOpnameResource).
 */
class StockOpnameController extends Controller
{
    public function __construct(private readonly AuditLogger $audit, private readonly StockLedger $ledger) {}

    public function index(ListStockOpnamesRequest $request): JsonResponse
    {
        $query = StockOpname::query()->with('creator', 'submitter', 'poster', 'canceller', 'rejecter')->withCount('items');

        if ($search = $request->validated('search')) {
            $query->where('number', 'like', "%{$search}%");
        }
        if ($status = $request->validated('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->validated('date_from')) {
            $query->whereDate('opname_date', '>=', $from);
        }
        if ($to = $request->validated('date_to')) {
            $query->whereDate('opname_date', '<=', $to);
        }

        $query->orderBy('opname_date', 'desc')->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), StockOpnameResource::class, $request);
    }

    public function show(Request $request, StockOpname $stockOpname): JsonResponse
    {
        return $this->respond($request, $stockOpname);
    }

    public function store(StoreStockOpnameRequest $request): JsonResponse
    {
        $opname = DB::transaction(function () use ($request) {
            $opname = StockOpname::create([
                // Temporary unique number; replaced below with SO-{id}.
                'number' => 'TMP-'.Str::upper(Str::random(20)),
                'opname_date' => $request->validated('opname_date'),
                'status' => OpnameStatus::Draft,
                'notes' => $request->validated('notes'),
                'created_by' => $request->user()->id,
            ]);
            $opname->update(['number' => 'SO-'.str_pad((string) $opname->id, 6, '0', STR_PAD_LEFT)]);

            $this->audit->log(AuditAction::OPNAME_CREATED, $opname, "Membuat stok opname {$opname->number} tanggal {$opname->opname_date->translatedFormat('j M Y')}", null, [
                'opname_date' => $opname->opname_date->toDateString(),
                'notes' => $opname->notes,
            ]);

            return $opname;
        });

        return $this->respond($request, $opname, 201);
    }

    /** Replaces the item list of a draft. system_qty = current stock, only for display (recomputed at posting). */
    public function updateItems(UpdateStockOpnameItemsRequest $request, StockOpname $stockOpname): JsonResponse
    {
        DB::transaction(function () use ($request, $stockOpname) {
            $opname = $this->lock($stockOpname, [OpnameStatus::Draft], 'Hanya opname berstatus Draft yang bisa diubah.');
            $before = $this->itemsSnapshot($opname);

            $opname->items()->delete();
            foreach ($request->validated('items') as $item) {
                $counted = $item['counted_qty'] ?? null;
                $opname->items()->create([
                    'product_id' => $item['product_id'],
                    'system_qty' => StockLedger::lockedBalanceQuery((int) $item['product_id'])->value('qty') ?? '0',
                    'counted_qty' => ($counted === null || $counted === '') ? null : Dec::qty((string) $counted),
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $count = count($request->validated('items'));
            $this->audit->log(AuditAction::OPNAME_UPDATED, $opname, "Mengisi hasil hitung stok opname {$opname->number} ({$count} barang)", $before, $this->itemsSnapshot($opname));
        });

        return $this->respond($request, $stockOpname);
    }

    public function submit(Request $request, StockOpname $stockOpname): JsonResponse
    {
        DB::transaction(function () use ($request, $stockOpname) {
            $opname = $this->lock($stockOpname, [OpnameStatus::Draft], 'Hanya opname berstatus Draft yang bisa diajukan.');
            $items = $opname->items()->get();
            if ($items->isEmpty()) {
                throw new BusinessRuleException('Tambahkan minimal 1 barang sebelum mengajukan opname.');
            }
            if ($items->contains(fn (StockOpnameItem $item) => $item->counted_qty === null)) {
                throw new BusinessRuleException('Semua barang harus diisi hasil hitungnya sebelum opname diajukan.');
            }

            $opname->update([
                'status' => OpnameStatus::MenungguPersetujuan,
                'submitted_by' => $request->user()->id,
                'submitted_at' => now(),
                // A new submit replaces the previous rejection note (the audit log keeps it).
                'rejected_by' => null,
                'rejected_at' => null,
                'reject_reason' => null,
            ]);

            $this->audit->log(AuditAction::OPNAME_SUBMITTED, $opname, "Mengajukan stok opname {$opname->number} ({$items->count()} barang) untuk disetujui Owner", ['status' => OpnameStatus::Draft->value], ['status' => OpnameStatus::MenungguPersetujuan->value]);
        });

        return $this->respond($request, $stockOpname);
    }

    /**
     * Owner approves (B5.5): under lock, for every item system_qty := current stock Q and diff = counted − Q.
     * diff > 0 -> opname_in, diff < 0 -> opname_out (through StockLedger), diff = 0 -> no movement. Status selesai.
     */
    public function post(Request $request, StockOpname $stockOpname): JsonResponse
    {
        DB::transaction(function () use ($request, $stockOpname) {
            $opname = $this->lock($stockOpname, [OpnameStatus::MenungguPersetujuan], 'Hanya opname yang menunggu persetujuan yang bisa disetujui.');
            // Lock the balances in product_id order (same order as StockLedger, prevents deadlocks).
            $items = $opname->items()->get()->sortBy('product_id')->values();

            $in = [];
            $out = [];
            foreach ($items as $item) {
                $systemQty = StockLedger::lockedBalanceQuery($item->product_id)->firstOrFail()->qty;
                $diff = Dec::sub($item->counted_qty, $systemQty, 3);
                $item->update(['system_qty' => $systemQty, 'diff_qty' => $diff]);

                $line = ['product_id' => $item->product_id, 'qty' => ltrim($diff, '-'), 'stock_opname_item_id' => $item->id];
                if (Dec::cmp($diff, '0') > 0) {
                    $in[] = $line;
                } elseif (Dec::cmp($diff, '0') < 0) {
                    $out[] = $line;
                }
            }

            $date = $opname->opname_date->toDateString();
            $notes = "Stok opname {$opname->number}";
            if ($out !== []) {
                $this->ledger->apply($out, new MovementContext(MovementType::OpnameOut, $date, $request->user()->id, notes: $notes));
            }
            if ($in !== []) {
                $this->ledger->apply($in, new MovementContext(MovementType::OpnameIn, $date, $request->user()->id, notes: $notes));
            }

            $opname->update(['status' => OpnameStatus::Selesai, 'posted_by' => $request->user()->id, 'posted_at' => now()]);

            $changed = count($in) + count($out);
            $this->audit->log(
                AuditAction::OPNAME_POSTED,
                $opname,
                "Menyetujui stok opname {$opname->number}: {$items->count()} barang dihitung, {$changed} barang dikoreksi",
                ['status' => OpnameStatus::MenungguPersetujuan->value],
                ['status' => OpnameStatus::Selesai->value, 'items' => $this->itemsSnapshot($opname)['items']],
            );
        });

        return $this->respond($request, $stockOpname);
    }

    public function reject(RejectStockOpnameRequest $request, StockOpname $stockOpname): JsonResponse
    {
        DB::transaction(function () use ($request, $stockOpname) {
            $opname = $this->lock($stockOpname, [OpnameStatus::MenungguPersetujuan], 'Hanya opname yang menunggu persetujuan yang bisa ditolak.');
            $reason = $request->validated('reason');

            $opname->update([
                'status' => OpnameStatus::Draft,
                'submitted_by' => null,
                'submitted_at' => null,
                'rejected_by' => $request->user()->id,
                'rejected_at' => now(),
                'reject_reason' => $reason,
            ]);

            $this->audit->log(AuditAction::OPNAME_REJECTED, $opname, "Menolak stok opname {$opname->number} (kembali ke Draft): {$reason}", ['status' => OpnameStatus::MenungguPersetujuan->value], ['status' => OpnameStatus::Draft->value, 'reason' => $reason]);
        });

        return $this->respond($request, $stockOpname);
    }

    public function cancel(Request $request, StockOpname $stockOpname): JsonResponse
    {
        DB::transaction(function () use ($request, $stockOpname) {
            $opname = $this->lock($stockOpname, [OpnameStatus::Draft, OpnameStatus::MenungguPersetujuan], 'Opname yang sudah selesai atau dibatalkan tidak bisa dibatalkan.');
            $oldStatus = $opname->status;

            $opname->update(['status' => OpnameStatus::Batal, 'cancelled_by' => $request->user()->id, 'cancelled_at' => now()]);

            $this->audit->log(AuditAction::OPNAME_CANCELLED, $opname, "Membatalkan stok opname {$opname->number} ({$oldStatus->label()})", ['status' => $oldStatus->value], ['status' => OpnameStatus::Batal->value]);
        });

        return $this->respond($request, $stockOpname);
    }

    /** Re-reads the opname with a row lock and checks its status. @param list<OpnameStatus> $allowed */
    private function lock(StockOpname $opname, array $allowed, string $message): StockOpname
    {
        $locked = StockOpname::lockForUpdate()->findOrFail($opname->id);
        if (! in_array($locked->status, $allowed, true)) {
            throw new BusinessRuleException($message);
        }

        return $locked;
    }

    private function itemsSnapshot(StockOpname $opname): array
    {
        return [
            'items' => $opname->items()->get()->map(fn (StockOpnameItem $item) => [
                'product_id' => $item->product_id,
                'system_qty' => $item->system_qty,
                'counted_qty' => $item->counted_qty,
                'diff_qty' => $item->diff_qty,
            ])->all(),
        ];
    }

    private function respond(Request $request, StockOpname $opname, int $status = 200): JsonResponse
    {
        $opname = $opname->fresh(['creator', 'submitter', 'poster', 'canceller', 'rejecter', 'items.product.unit', 'items.product.stockBalance']);

        return response()->json(['data' => (new StockOpnameResource($opname))->resolve($request)], $status);
    }
}
