<?php

namespace Tests\Unit;

use App\Support\Dec;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class DecTest extends TestCase
{
    public function test_round_rupiah_half_away_from_zero(): void
    {
        $this->assertSame(1001, Dec::roundRupiah('1000.5'));
        $this->assertSame(1000, Dec::roundRupiah('1000.49'));
        $this->assertSame(1000, Dec::roundRupiah('1000.25'));
        $this->assertSame(-1001, Dec::roundRupiah('-1000.5'));
        $this->assertSame(0, Dec::roundRupiah('0'));
    }

    public function test_basic_operations(): void
    {
        $this->assertSame('0.300000', Dec::add('0.1', '0.2'));
        $this->assertSame('11500.0000', Dec::div('2300000', '200', 4));
        $this->assertSame('575000.000000', Dec::mul('11500', '50'));
        $this->assertSame(1000, Dec::roundRupiah(Dec::div(Dec::mul('4001', '1'), '4')));
        $this->assertSame(-1, Dec::cmp('1.5', '2'));
        $this->assertTrue(Dec::isZero('0.000'));
        $this->assertSame('12.500', Dec::qty('12.5'));
    }

    public function test_division_by_zero_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Dec::div('1', '0');
    }

    public function test_invalid_input_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Dec::add('1,5', '1');
    }
}
