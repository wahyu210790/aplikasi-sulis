<?php

namespace Database\Factories;

use App\Enums\PurchaseStatus;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use App\Support\Dec;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A DRAFT purchase. Receive it through the API (POST /purchases/{id}/receive) so stock goes through the ledger.
 *
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => 'PB-T'.fake()->unique()->numerify('######'),
            'supplier_id' => Supplier::factory(),
            'purchase_date' => now()->toDateString(),
            'invoice_no' => null,
            'status' => PurchaseStatus::Draft,
            'total_value' => 0,
            'notes' => null,
            'created_by' => User::factory()->finance(),
        ];
    }

    /** Adds one line and updates total_value. Example: Purchase::factory()->withItem($product, '10', 12000)->create() */
    public function withItem(Product $product, string $qty, int $unitPrice): static
    {
        return $this->afterCreating(function (Purchase $purchase) use ($product, $qty, $unitPrice) {
            $lineTotal = Dec::roundRupiah(Dec::mul($qty, (string) $unitPrice));
            $purchase->items()->create(['product_id' => $product->id, 'qty' => $qty, 'unit_price' => $unitPrice, 'line_total' => $lineTotal]);
            $purchase->update(['total_value' => $purchase->total_value + $lineTotal]);
        });
    }

    public function status(PurchaseStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
