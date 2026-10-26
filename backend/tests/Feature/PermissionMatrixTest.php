<?php

namespace Tests\Feature;

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
        $target = User::factory()->gudang()->create();

        foreach (self::MATRIX as $key => $allowed) {
            [$method, $uri] = explode(' ', $key, 2);
            $url = '/'.str_replace('{user}', (string) $target->id, $uri);

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
