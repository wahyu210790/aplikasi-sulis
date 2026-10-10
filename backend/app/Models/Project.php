<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ProjectExpense;

class Project extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function expenses()
    {
        return $this->hasMany(ProjectExpense::class);
    }
}
