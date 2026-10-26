<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\ProjectStatus;
use App\Exceptions\BusinessRuleException;
use App\Models\Product;
use App\Models\Project;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Support\Dec;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use LogicException;

/**
 * THE ONLY code allowed to write stock_movements or stock_balances (docs/desain-v2.md B4).
 *
 * Lines (qty is a positive decimal string, e.g. "12.5"):
 * - opening, purchase_in:            ['product_id' => 1, 'qty' => '10', 'value' => 125000, 'purchase_item_id' => null]
 * - project_out, project_return,
 *   opname_in, opname_out:           ['product_id' => 1, 'qty' => '10', 'stock_opname_item_id' => null]
 * - reversal:                        ['movement' => StockMovement $original]
 *
 * Must run inside the caller's DB::transaction(). Any rule violation throws
 * BusinessRuleException (HTTP 422) and the caller's whole transaction rolls back.
 */
class StockLedger
{
    private const VALUE_ADJUSTED_NOTE = 'penyesuaian nilai karena harga rata-rata';

    /** @return Collection<int, StockMovement> the new movements, in the order they were written */
    public function apply(array $lines, MovementContext $ctx): Collection
    {
        if (DB::transactionLevel() === 0) {
            throw new LogicException('StockLedger::apply() must run inside DB::transaction().');
        }
        if ($lines === []) {
            throw new InvalidArgumentException('StockLedger::apply() needs at least one line.');
        }

        $this->checkProject($ctx);

        $lines = array_map(fn (array $line) => $this->normalise($line, $ctx), $lines);
        // B4.2 step 1: always lock balances in product_id order (prevents deadlocks).
        usort($lines, fn (array $a, array $b) => $a['product_id'] <=> $b['product_id']);

        $movements = new Collection;
        foreach ($lines as $line) {
            $movements->push($this->applyLine($line, $ctx));
        }

        return $movements;
    }

    /** The balance row read with a row lock (SELECT ... FOR UPDATE on MySQL). */
    public static function lockedBalanceQuery(int $productId): Builder
    {
        return StockBalance::query()->where('product_id', $productId)->lockForUpdate();
    }

    /**
     * Net qty/value a project still holds, per product (docs/desain-v2.md B4.6):
     * qty = −Σ qty_change, value = −Σ value_change over movements with this project_id
     * (project_out, project_return and their reversals).
     *
     * @return array<int, array{qty: string, value: int}> keyed by product_id
     */
    public function projectNet(int $projectId, ?int $productId = null): array
    {
        $query = StockMovement::query()->where('project_id', $projectId)->orderBy('id');
        if ($productId !== null) {
            $query->where('product_id', $productId);
        }

        $net = [];
        foreach ($query->get(['product_id', 'qty_change', 'value_change']) as $movement) {
            $row = $net[$movement->product_id] ?? ['qty' => '0.000', 'value' => 0];
            $row['qty'] = Dec::sub($row['qty'], $movement->qty_change, 3);
            $row['value'] -= $movement->value_change;
            $net[$movement->product_id] = $row;
        }

        return $net;
    }

    /** "1250.500" => "1.250,5" (for Indonesian error messages). */
    public static function formatQty(string $qty): string
    {
        [$int, $dec] = explode('.', Dec::qty($qty));
        $negative = str_starts_with($int, '-');
        $int = number_format((int) ltrim($int, '-'), 0, ',', '.');
        $dec = rtrim($dec, '0');

        return ($negative ? '-' : '').$int.($dec === '' ? '' : ','.$dec);
    }

    private function checkProject(MovementContext $ctx): void
    {
        if (! in_array($ctx->type, [MovementType::ProjectOut, MovementType::ProjectReturn], true)) {
            return;
        }
        if ($ctx->projectId === null) {
            throw new InvalidArgumentException('project_out and project_return need a project.');
        }

        $project = Project::findOrFail($ctx->projectId);
        if ($ctx->type === MovementType::ProjectOut && $project->status !== ProjectStatus::Aktif) {
            throw new BusinessRuleException("Proyek {$project->code} berstatus {$project->status->label()}. Barang keluar hanya bisa ke proyek berstatus Aktif.");
        }
        if ($ctx->type === MovementType::ProjectReturn && $project->status === ProjectStatus::Batal) {
            throw new BusinessRuleException("Proyek {$project->code} berstatus Batal. Pengembalian hanya bisa ke proyek berstatus Aktif atau Selesai.");
        }
    }

    private function normalise(array $line, MovementContext $ctx): array
    {
        if ($ctx->type === MovementType::Reversal) {
            $movement = $line['movement'] ?? null;
            if (! $movement instanceof StockMovement) {
                throw new InvalidArgumentException('A reversal line needs ["movement" => StockMovement].');
            }

            return ['product_id' => $movement->product_id, 'movement' => $movement];
        }

        $qty = (string) ($line['qty'] ?? '');
        if (! preg_match('/^\d{1,12}(\.\d{1,3})?$/', $qty) || Dec::isZero($qty)) {
            throw new InvalidArgumentException("Invalid qty: {$qty}");
        }
        $line['qty'] = Dec::qty($qty);
        $line['product_id'] = (int) $line['product_id'];

        if (in_array($ctx->type, [MovementType::Opening, MovementType::PurchaseIn], true)) {
            if (! is_int($line['value'] ?? null) || $line['value'] < 0) {
                throw new InvalidArgumentException('opening and purchase_in lines need an integer value >= 0.');
            }
        }

        return $line;
    }

    private function applyLine(array $line, MovementContext $ctx): StockMovement
    {
        // B4.2 step 2: lock the balance row first, then read everything else.
        $balance = self::lockedBalanceQuery($line['product_id'])->firstOrFail();
        $product = Product::with('unit')->findOrFail($line['product_id']);

        $exempt = in_array($ctx->type, [MovementType::Reversal, MovementType::OpnameIn, MovementType::OpnameOut], true);
        if (! $exempt && ! $product->is_active) {
            throw new BusinessRuleException("Barang {$product->sku} ({$product->name}) sudah nonaktif dan tidak bisa dipakai untuk transaksi baru.");
        }

        $q = $balance->qty;
        $v = (string) $balance->stock_value;
        $notes = $ctx->notes;
        $projectId = $ctx->projectId;
        $reversesId = null;

        switch ($ctx->type) {
            case MovementType::Opening:
                if (StockMovement::where('product_id', $product->id)->exists()) {
                    throw new BusinessRuleException("Stok awal {$product->sku} sudah pernah diisi atau barang sudah punya transaksi.");
                }
                $qtyChange = $line['qty'];
                $valueChange = $line['value'];
                break;

            case MovementType::PurchaseIn:
                $qtyChange = $line['qty'];
                $valueChange = $line['value'];
                break;

            case MovementType::ProjectOut:
            case MovementType::OpnameOut:
                $qtyChange = Dec::sub('0', $line['qty'], 3);
                $valueChange = -$this->averageOutValue($product, $line['qty'], $q, $v);
                break;

            case MovementType::ProjectReturn:
                $qtyChange = $line['qty'];
                $valueChange = $this->returnValue($product, $line['qty'], $ctx->projectId);
                break;

            case MovementType::OpnameIn:
                $qtyChange = $line['qty'];
                $valueChange = Dec::roundRupiah(Dec::mul($line['qty'], $balance->avg_cost));
                break;

            case MovementType::Reversal:
                [$qtyChange, $valueChange, $adjusted] = $this->reversalChange($product, $line['movement'], $q, $v);
                $projectId = $line['movement']->project_id;
                $reversesId = $line['movement']->id;
                if ($adjusted) {
                    $notes = trim(($notes ?? '').' ('.self::VALUE_ADJUSTED_NOTE.')');
                }
                break;
        }

        $qtyAfter = Dec::add($q, $qtyChange, 3);
        $valueAfter = (int) $v + $valueChange;
        $avgAfter = Dec::cmp($qtyAfter, '0') > 0 ? Dec::div((string) $valueAfter, $qtyAfter, 4) : $balance->avg_cost;

        // B4.3 invariants. A violation here is a bug, never a user error.
        if (Dec::cmp($qtyAfter, '0') < 0 || $valueAfter < 0 || (Dec::isZero($qtyAfter) && $valueAfter !== 0)) {
            throw new LogicException("Stock invariant broken for product {$product->id}: qty {$qtyAfter}, value {$valueAfter}.");
        }

        $balance->update([
            'qty' => $qtyAfter,
            'stock_value' => $valueAfter,
            'avg_cost' => $avgAfter,
            'has_cost' => $balance->has_cost || in_array($ctx->type, [MovementType::Opening, MovementType::PurchaseIn], true),
        ]);

        $absQty = ltrim($qtyChange, '-');

        return StockMovement::create([
            'product_id' => $product->id,
            'type' => $ctx->type,
            'qty_change' => $qtyChange,
            'value_change' => $valueChange,
            'unit_cost' => Dec::div((string) abs($valueChange), $absQty, 4),
            'qty_after' => $qtyAfter,
            'value_after' => $valueAfter,
            'avg_cost_after' => $avgAfter,
            'project_id' => $projectId,
            'stock_transaction_id' => $ctx->stockTransactionId,
            'purchase_item_id' => $line['purchase_item_id'] ?? null,
            'stock_opname_item_id' => $line['stock_opname_item_id'] ?? null,
            'reverses_movement_id' => $reversesId,
            'movement_date' => $ctx->movementDate,
            'notes' => $notes,
            'created_by' => $ctx->userId,
        ]);
    }

    /** B4.3 average-cost out rule. Returns v (positive). */
    private function averageOutValue(Product $product, string $qty, string $q, string $v): int
    {
        if (Dec::cmp($qty, $q) > 0) {
            throw new BusinessRuleException("Stok {$product->name} tidak cukup. Sisa stok: ".self::formatQty($q)." {$product->unit->symbol}.");
        }

        // Taking the whole balance always takes the whole value (no residue).
        return Dec::cmp($qty, $q) === 0 ? (int) $v : Dec::roundRupiah(Dec::div(Dec::mul($v, $qty), $q));
    }

    /** B4.3 project issue-cost rule: valued at the project's own average issue cost. Returns v (positive). */
    private function returnValue(Product $product, string $qty, int $projectId): int
    {
        $net = $this->projectNet($projectId, $product->id)[$product->id] ?? ['qty' => '0.000', 'value' => 0];

        if (Dec::cmp($qty, $net['qty']) > 0) {
            throw new BusinessRuleException("Jumlah pengembalian {$product->name} melebihi barang yang diambil proyek ini (".self::formatQty($net['qty'])." {$product->unit->symbol}).");
        }

        return Dec::cmp($qty, $net['qty']) === 0
            ? $net['value']
            : Dec::roundRupiah(Dec::div(Dec::mul((string) $net['value'], $qty), $net['qty']));
    }

    /**
     * B4.4 reversal rule with guards and the value guard.
     *
     * @return array{0: string, 1: int, 2: bool} [qty_change, value_change, value adjusted?]
     */
    private function reversalChange(Product $product, StockMovement $original, string $q, string $v): array
    {
        if ($original->type === MovementType::Reversal) {
            throw new BusinessRuleException('Pembatalan tidak bisa dibatalkan lagi.');
        }
        if (! $original->type->isReversible()) {
            throw new BusinessRuleException('Stok awal dan koreksi stok opname tidak bisa dibatalkan. Perbaiki lewat stock opname.');
        }
        if (StockMovement::where('reverses_movement_id', $original->id)->exists()) {
            throw new BusinessRuleException('Transaksi ini sudah dibatalkan.');
        }

        $qtyChange = Dec::sub('0', $original->qty_change, 3);
        $qtyAfter = Dec::add($q, $qtyChange, 3);
        if (Dec::cmp($qtyAfter, '0') < 0) {
            throw new BusinessRuleException("Tidak bisa dibatalkan: stok {$product->name} sudah terpakai. Sisa stok ".self::formatQty($q)." {$product->unit->symbol}.");
        }

        $valueChange = -$original->value_change;
        $adjusted = false;
        // Value guard: only when the original was an inflow (e.g. reversing a purchase_in).
        if (Dec::cmp($original->qty_change, '0') > 0) {
            if (Dec::isZero($qtyAfter) || (int) $v - $original->value_change < 0) {
                $adjusted = $valueChange !== -((int) $v);
                $valueChange = -((int) $v);
            }
        }

        return [$qtyChange, $valueChange, $adjusted];
    }
}
