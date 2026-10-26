<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Enums\PurchaseStatus;
use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\CancelPurchaseRequest;
use App\Http\Requests\Purchase\ListPurchasesRequest;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\AuditLogger;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use App\Support\Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Purchases (docs/desain-v2.md B5.1, B6). Gudang never sees "batal" purchases nor any money key. */
class PurchaseController extends Controller
{
    public function __construct(private readonly AuditLogger $audit, private readonly StockLedger $ledger) {}

    public function index(ListPurchasesRequest $request): JsonResponse
    {
        $query = Purchase::query()->with('supplier', 'creator', 'receiver', 'canceller')->withCount('items');

        if (! $request->user()->canSeeMoney()) {
            $query->whereIn('status', [PurchaseStatus::Draft->value, PurchaseStatus::Diterima->value]);
        }
        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status = $request->validated('status')) {
            $query->where('status', $status);
        }
        if ($supplierId = $request->validated('supplier_id')) {
            $query->where('supplier_id', $supplierId);
        }
        if ($from = $request->validated('date_from')) {
            $query->whereDate('purchase_date', '>=', $from);
        }
        if ($to = $request->validated('date_to')) {
            $query->whereDate('purchase_date', '<=', $to);
        }

        $query->orderBy($request->validated('sort') ?? 'purchase_date', $request->validated('direction') ?? 'desc')
            ->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), PurchaseResource::class, $request);
    }

    public function show(Request $request, Purchase $purchase): JsonResponse
    {
        // B6: Gudang only sees draft and diterima. A cancelled purchase "does not exist" for Gudang.
        if (! $request->user()->canSeeMoney() && $purchase->status === PurchaseStatus::Batal) {
            abort(404);
        }

        return $this->respond($request, $purchase);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = DB::transaction(function () use ($request) {
            $purchase = Purchase::create([
                // Temporary unique number; replaced below with PB-{id}.
                'number' => 'TMP-'.Str::upper(Str::random(20)),
                'supplier_id' => $request->validated('supplier_id'),
                'purchase_date' => $request->validated('purchase_date'),
                'invoice_no' => $request->validated('invoice_no'),
                'status' => PurchaseStatus::Draft,
                'notes' => $request->validated('notes'),
                'created_by' => $request->user()->id,
            ]);
            $purchase->number = 'PB-'.str_pad((string) $purchase->id, 6, '0', STR_PAD_LEFT);
            $this->saveItems($purchase, $request->validated('items'));

            $this->audit->log(AuditAction::PURCHASE_CREATED, $purchase, "Membuat pembelian {$purchase->number} dari {$purchase->supplier->name} (".count($request->validated('items')).' barang)', null, $this->snapshot($purchase));

            return $purchase;
        });

        return $this->respond($request, $purchase, 201);
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        DB::transaction(function () use ($request, $purchase) {
            $purchase = $this->lockDraft($purchase, 'Hanya pembelian berstatus Draft yang bisa diubah.');
            $before = $this->snapshot($purchase);

            $purchase->fill([
                'supplier_id' => $request->validated('supplier_id'),
                'purchase_date' => $request->validated('purchase_date'),
                'invoice_no' => $request->validated('invoice_no'),
                'notes' => $request->validated('notes'),
            ]);
            $purchase->items()->delete();
            $this->saveItems($purchase, $request->validated('items'));

            $this->audit->log(AuditAction::PURCHASE_UPDATED, $purchase, "Mengubah pembelian {$purchase->number}", $before, $this->snapshot($purchase->fresh()));
        });

        return $this->respond($request, $purchase->fresh());
    }

    public function destroy(Purchase $purchase): Response
    {
        DB::transaction(function () use ($purchase) {
            $purchase = $this->lockDraft($purchase, 'Hanya pembelian berstatus Draft yang bisa dihapus.');
            $this->audit->log(AuditAction::PURCHASE_DELETED, $purchase, "Menghapus draft pembelian {$purchase->number}", $this->snapshot($purchase), null);
            $purchase->delete();
        });

        return response()->noContent();
    }

    /** B5.1 step 3: Gudang/Owner confirm the goods arrived. Stock goes in at the purchase price. */
    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        DB::transaction(function () use ($request, $purchase) {
            $purchase = $this->lockDraft($purchase, 'Pembelian ini sudah diproses.');
            $purchase->load('items');

            $this->ledger->apply(
                $purchase->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'qty' => $item->qty,
                    'value' => $item->line_total,
                    'purchase_item_id' => $item->id,
                ])->all(),
                new MovementContext(MovementType::PurchaseIn, $purchase->purchase_date->toDateString(), $request->user()->id, notes: "Pembelian {$purchase->number}"),
            );

            $purchase->update(['status' => PurchaseStatus::Diterima, 'received_by' => $request->user()->id, 'received_at' => now()]);

            $this->audit->log(AuditAction::PURCHASE_RECEIVED, $purchase, "Menerima barang pembelian {$purchase->number} ({$purchase->items->count()} barang)", ['status' => PurchaseStatus::Draft->value], ['status' => PurchaseStatus::Diterima->value]);
        });

        return $this->respond($request, $purchase->fresh());
    }

    /** B5.1 step 4. Draft -> batal (Finance/Owner). Received purchases: T3.04. */
    public function cancel(CancelPurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        DB::transaction(function () use ($request, $purchase) {
            $purchase = Purchase::lockForUpdate()->findOrFail($purchase->id);
            if ($purchase->status === PurchaseStatus::Batal) {
                throw new BusinessRuleException('Pembelian ini sudah dibatalkan.');
            }
            if ($purchase->status === PurchaseStatus::Diterima) {
                throw new BusinessRuleException('Pembelian yang sudah diterima belum bisa dibatalkan.');
            }

            $this->markCancelled($request, $purchase);
        });

        return $this->respond($request, $purchase->fresh());
    }

    private function markCancelled(CancelPurchaseRequest $request, Purchase $purchase): void
    {
        $oldStatus = $purchase->status;
        $purchase->update([
            'status' => PurchaseStatus::Batal,
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'cancel_reason' => $request->validated('reason'),
        ]);

        $this->audit->log(
            AuditAction::PURCHASE_CANCELLED,
            $purchase,
            "Membatalkan pembelian {$purchase->number} ({$oldStatus->label()}): {$request->validated('reason')}",
            ['status' => $oldStatus->value],
            ['status' => PurchaseStatus::Batal->value, 'reason' => $request->validated('reason')],
        );
    }

    /** Re-reads the purchase with a row lock and checks it is still a draft. */
    private function lockDraft(Purchase $purchase, string $message): Purchase
    {
        $locked = Purchase::lockForUpdate()->findOrFail($purchase->id);
        if ($locked->status !== PurchaseStatus::Draft) {
            throw new BusinessRuleException($message);
        }

        return $locked;
    }

    /** Writes the lines (line_total = roundRupiah(qty x unit_price)) and the purchase total. */
    private function saveItems(Purchase $purchase, array $items): void
    {
        $total = 0;
        foreach ($items as $item) {
            $lineTotal = Dec::roundRupiah(Dec::mul((string) $item['qty'], (string) $item['unit_price']));
            $purchase->items()->create([
                'product_id' => $item['product_id'],
                'qty' => Dec::qty((string) $item['qty']),
                'unit_price' => (int) $item['unit_price'],
                'line_total' => $lineTotal,
            ]);
            $total += $lineTotal;
        }
        $purchase->total_value = $total;
        $purchase->save();
    }

    private function snapshot(Purchase $purchase): array
    {
        return [
            'supplier_id' => $purchase->supplier_id,
            'purchase_date' => $purchase->purchase_date->toDateString(),
            'invoice_no' => $purchase->invoice_no,
            'notes' => $purchase->notes,
            'total_value' => $purchase->total_value,
            'items' => $purchase->items()->get()->map(fn ($item) => [
                'product_id' => $item->product_id,
                'qty' => $item->qty,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ])->all(),
        ];
    }

    private function respond(Request $request, Purchase $purchase, int $status = 200): JsonResponse
    {
        $purchase->load('supplier', 'creator', 'receiver', 'canceller', 'items.product.unit');

        return response()->json(['data' => (new PurchaseResource($purchase))->resolve($request)], $status);
    }
}
