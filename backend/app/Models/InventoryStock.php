<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'quantity',
        'average_cost',
        'total_value',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
