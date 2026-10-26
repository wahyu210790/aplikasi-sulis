<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * docs/desain-v2.md B6. EVERY api route must be listed in MATRIX.
 * Later tasks ADD rows here whenever they add a route. Never remove a row without a task saying so.
 * Value = list of roles that may call the route, or 'public' (no login needed).
 */
class PermissionMatrixTest extends TestCase
{
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
    ];

    private const ROLES = ['owner', 'gudang', 'finance'];

    public function test_every_api_route_is_listed_in_the_matrix(): void
    {
        $registered = [];
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/')) {
                continue;
            }
            foreach ($route->methods() as $method) {
                if (in_array($method, ['HEAD', 'OPTIONS'], true)) {
                    continue;
                }
                $registered[] = $method.' '.$route->uri();
            }
        }
        sort($registered);
        $listed = array_keys(self::MATRIX);
        sort($listed);

        $this->assertSame($listed, $registered, 'PermissionMatrixTest::MATRIX must list exactly the registered api routes.');
    }

    public function test_each_role_gets_403_only_where_not_allowed(): void
    {
        // Real ids for route parameters, so "allowed" calls never end in 404.
        $ids = [
            '{user}' => (string) User::factory()->gudang()->create()->id,
            '{category}' => (string) Category::factory()->create()->id,
            '{unit}' => (string) Unit::factory()->create()->id,
            '{product}' => (string) Product::factory()->create()->id,
            '{supplier}' => (string) Supplier::factory()->create()->id,
            '{project}' => (string) Project::factory()->create()->id,
        ];

        foreach (self::MATRIX as $key => $allowed) {
            [$method, $uri] = explode(' ', $key, 2);
            $url = '/'.strtr($uri, $ids);

            if ($allowed === 'public') {
                $this->app['auth']->forgetGuards();
                $status = $this->json($method, $url)->status();
                $this->assertNotSame(401, $status, "{$key} must be public");
                $this->assertNotSame(403, $status, "{$key} must be public");

                continue;
            }

            foreach (self::ROLES as $role) {
                $user = User::factory()->state(['role' => $role])->create();
                $token = $user->createToken('spa')->plainTextToken;
                $this->app['auth']->forgetGuards();

                $status = $this->json($method, $url, [], ['Authorization' => 'Bearer '.$token])->status();

                if (in_array($role, $allowed, true)) {
                    $this->assertNotSame(403, $status, "{$key} should be allowed for {$role}");
                    $this->assertNotSame(401, $status, "{$key} should be allowed for {$role}");
                } else {
                    $this->assertSame(403, $status, "{$key} should be FORBIDDEN for {$role}");
                }
            }

            $this->app['auth']->forgetGuards();
            $this->assertSame(401, $this->json($method, $url)->status(), "{$key} must require login");
        }
    }
}
