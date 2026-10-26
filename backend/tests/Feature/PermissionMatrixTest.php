<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ChecksPermissionMatrix;
use Tests\TestCase;

/**
 * docs/desain-v2.md B6. EVERY api route must be listed in MATRIX.
 * Later tasks ADD rows here whenever they add a route. Never remove a row without a task saying so.
 * Value = list of roles that may call the route, or 'public' (no login needed).
 * The checks themselves are in tests/Concerns/ChecksPermissionMatrix.php.
 */
class PermissionMatrixTest extends TestCase
{
    use ChecksPermissionMatrix;
    use RefreshDatabase;

    private const MATRIX = [
        'POST api/v1/auth/login' => 'public',
        'POST api/v1/auth/logout' => ['owner', 'gudang', 'finance'],
        'GET api/v1/auth/me' => ['owner', 'gudang', 'finance'],
        'PUT api/v1/auth/password' => ['owner', 'gudang', 'finance'],
        'GET api/v1/users' => ['owner'],
        'POST api/v1/users' => ['owner'],
        'PUT api/v1/users/{user}' => ['owner'],
        'POST api/v1/users/{user}/reset-password' => ['owner'],
        'GET api/v1/categories' => ['owner', 'gudang', 'finance'],
        'POST api/v1/categories' => ['owner', 'gudang'],
        'PUT api/v1/categories/{category}' => ['owner', 'gudang'],
        'GET api/v1/units' => ['owner', 'gudang', 'finance'],
        'POST api/v1/units' => ['owner', 'gudang'],
        'PUT api/v1/units/{unit}' => ['owner', 'gudang'],
        'GET api/v1/products' => ['owner', 'gudang', 'finance'],
        'GET api/v1/products/{product}' => ['owner', 'gudang', 'finance'],
        'POST api/v1/products' => ['owner', 'gudang'],
        'PUT api/v1/products/{product}' => ['owner', 'gudang'],
        'GET api/v1/suppliers' => ['owner', 'finance'],
        'POST api/v1/suppliers' => ['owner', 'finance'],
        'PUT api/v1/suppliers/{supplier}' => ['owner', 'finance'],
        'GET api/v1/projects' => ['owner', 'gudang', 'finance'],
        'GET api/v1/projects/{project}' => ['owner', 'gudang', 'finance'],
        'POST api/v1/projects' => ['owner', 'finance'],
        'PUT api/v1/projects/{project}' => ['owner', 'finance'],
        'GET api/v1/imports/products/template' => ['owner', 'gudang'],
        'POST api/v1/imports/products' => ['owner', 'gudang'],
        'POST api/v1/opening-stocks' => ['owner', 'finance'],
        'GET api/v1/imports/opening-stocks/template' => ['owner', 'finance'],
        'POST api/v1/imports/opening-stocks' => ['owner', 'finance'],
    ];

    protected function routeIds(): array
    {
        return [
            '{user}' => (string) User::factory()->gudang()->create()->id,
            '{category}' => (string) Category::factory()->create()->id,
            '{unit}' => (string) Unit::factory()->create()->id,
            '{product}' => (string) Product::factory()->create()->id,
            '{supplier}' => (string) Supplier::factory()->create()->id,
            '{project}' => (string) Project::factory()->create()->id,
        ];
    }
}
