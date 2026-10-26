<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Enums\StockTransactionStatus;
use App\Enums\StockTransactionType;
use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\ReverseStockTransactionRequest;
use App\Models\StockMovement;
use App\Models\StockTransaction;
use App\Services\AuditLogger;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\AuditAction;
use App\Support\Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Owner cancels a whole stock-out or return document (docs/desain-v2.md B5.4).
 * Nothing is edited or deleted: every line gets a reversal movement (B4.4) and the header becomes "reversed".
 */
class StockTransactionReversalController extends Controller
{
    public function __construct(private readonly StockLedger $ledger, private readonly AuditLogger $audit) {}

    public function store(ReverseStockTransactionRequest $request, StockTransaction $stockTransaction): JsonResponse
    {
        DB::transaction(function () use ($request, $stockTransaction) {
            $document = StockTransaction::with('project')->lockForUpdate()->findOrFail($stockTransaction->id);
            if ($document->status === StockTransactionStatus::Reversed) {
                throw new BusinessRuleException('Dokumen ini sudah dibatalkan.');
            }

            $lines = $document->lines()->with('product')->get();
            if ($document->type === StockTransactionType::ProjectOut) {
                $this->guardReturnedGoods($document, $lines->all());
            }

            $reason = $request->validated('reason');
            $this->ledger->apply(
                $lines->map(fn (StockMovement $line) => ['movement' => $line])->all(),
                new MovementContext(MovementType::Reversal, now()->toDateString(), $request->user()->id, $document->project_id, $document->id, "Pembatalan {$document->number}: {$reason}"),
            );

            $document->update([
                'status' => StockTransactionStatus::Reversed,
                'reversed_by' => $request->user()->id,
                'reversed_at' => now(),
                'reverse_reason' => $reason,
            ]);

            $this->audit->log(
                AuditAction::STOCK_TRANSACTION_REVERSED,
                $document,
                "Membatalkan {$document->type->label()} {$document->number} proyek {$document->project->code}: {$reason}",
                ['status' => StockTransactionStatus::Posted->value],
                ['status' => StockTransactionStatus::Reversed->value, 'reason' => $reason],
            );
        });

        return StockTransactionController::respond($request, $stockTransaction);
    }

    /**
     * A stock-out can only be cancelled while the project still holds those goods.
     * Otherwise the project would hold a negative quantity. Cancel the return first.
     *
     * @param  list<StockMovement>  $lines
     */
    private function guardReturnedGoods(StockTransaction $document, array $lines): void
    {
        foreach ($lines as $line) {
            $held = $this->ledger->projectNet($document->project_id, $line->product_id)[$line->product_id]['qty'] ?? '0';
            if (Dec::cmp($held, ltrim($line->qty_change, '-')) < 0) {
                throw new BusinessRuleException("Tidak bisa dibatalkan: sebagian {$line->product->name} sudah dikembalikan dari proyek ini. Batalkan dokumen pengembaliannya dulu.");
            }
        }
    }
}
