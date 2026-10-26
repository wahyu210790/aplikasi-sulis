<?php

namespace App\Services;

use App\Enums\StockTransactionStatus;
use App\Enums\StockTransactionType;
use App\Models\StockTransaction;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates a stock-out (BK-) or return (RT-) document: header + ledger movements + audit,
 * all in ONE DB transaction (docs/desain-v2.md B5.2, B5.3). Any 422 from the ledger rolls back everything.
 */
class StockDocumentService
{
    public function __construct(private readonly StockLedger $ledger, private readonly AuditLogger $audit) {}

    /** @param array{project_id: int|string, person_name: string, transaction_date: string, notes?: ?string, items: list<array{product_id: int|string, qty: string}>} $data */
    public function create(StockTransactionType $type, array $data, User $user): StockTransaction
    {
        return DB::transaction(function () use ($type, $data, $user) {
            $document = StockTransaction::create([
                // Temporary unique number; replaced below with BK-{id} / RT-{id}.
                'number' => 'TMP-'.Str::upper(Str::random(20)),
                'type' => $type,
                'project_id' => (int) $data['project_id'],
                'person_name' => $data['person_name'],
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'status' => StockTransactionStatus::Posted,
                'created_by' => $user->id,
            ]);
            $document->update(['number' => $type->prefix().'-'.str_pad((string) $document->id, 6, '0', STR_PAD_LEFT)]);

            $this->ledger->apply(
                array_map(fn (array $item) => ['product_id' => (int) $item['product_id'], 'qty' => (string) $item['qty']], $data['items']),
                new MovementContext($type->movementType(), $data['transaction_date'], $user->id, $document->project_id, $document->id),
            );

            $document->load('project');
            $count = count($data['items']);
            [$action, $summary] = match ($type) {
                StockTransactionType::ProjectOut => [AuditAction::STOCK_OUT_CREATED, "Barang keluar {$document->number} ke proyek {$document->project->code} ({$count} barang) oleh {$document->person_name}"],
                StockTransactionType::ProjectReturn => [AuditAction::STOCK_RETURN_CREATED, "Pengembalian {$document->number} dari proyek {$document->project->code} ({$count} barang) oleh {$document->person_name}"],
            };
            $this->audit->log($action, $document, $summary, null, [
                'number' => $document->number,
                'project_id' => $document->project_id,
                'person_name' => $document->person_name,
                'transaction_date' => $data['transaction_date'],
                'items' => $document->lines()->get(['product_id', 'qty_change', 'value_change'])->toArray(),
            ], $user);

            return $document;
        });
    }
}
