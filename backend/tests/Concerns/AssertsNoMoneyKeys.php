<?php

namespace Tests\Concerns;

use Illuminate\Testing\TestResponse;

/**
 * docs/desain-v2.md B7: for Gudang, money keys must be ABSENT (not null) at any depth.
 * Use: $this->assertNoMoneyKeys($this->getJson('/api/v1/products'));
 */
trait AssertsNoMoneyKeys
{
    /** Every money key listed in B7. Later tasks may ADD keys here (never remove). */
    protected const MONEY_KEYS = [
        'avg_cost', 'stock_value', 'has_cost',
        'value_change', 'unit_cost', 'value_after', 'avg_cost_after',
        'total_value', 'unit_price', 'line_total', 'value',
        'contract_value', 'amount', 'material_cost', 'other_costs', 'profit', 'margin_percent',
    ];

    protected function assertNoMoneyKeys(TestResponse $response): void
    {
        $response->assertSuccessful();
        $found = $this->findMoneyKeys($response->json(), '');

        $this->assertSame([], $found, 'Money keys must be absent for Gudang, found: '.implode(', ', $found));
    }

    /** @return list<string> paths of money keys found */
    private function findMoneyKeys(mixed $data, string $path): array
    {
        if (! is_array($data)) {
            return [];
        }

        $found = [];
        foreach ($data as $key => $value) {
            $here = $path === '' ? (string) $key : $path.'.'.$key;
            if (is_string($key) && in_array($key, self::MONEY_KEYS, true)) {
                $found[] = $here;
            }
            $found = [...$found, ...$this->findMoneyKeys($value, $here)];
        }

        return $found;
    }
}
