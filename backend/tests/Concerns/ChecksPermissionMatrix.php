<?php

namespace Tests\Concerns;

use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * The two PermissionMatrixTest checks (docs/desain-v2.md B6, B13).
 * The using test defines MATRIX (route => roles or 'public') and routeIds().
 */
trait ChecksPermissionMatrix
{
    private const ROLES = ['owner', 'gudang', 'finance'];

    /**
     * Real ids for route parameters, e.g. ['{product}' => '5'], so "allowed" calls never end in 404.
     * Called again for every single request: a call may change or delete the record.
     *
     * @return array<string, string>
     */
    abstract protected function routeIds(): array;

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
        foreach (self::MATRIX as $key => $allowed) {
            [$method, $uri] = explode(' ', $key, 2);

            if ($allowed === 'public') {
                $this->app['auth']->forgetGuards();
                $status = $this->json($method, '/'.strtr($uri, $this->routeIds()))->getStatusCode();
                $this->assertNotSame(401, $status, "{$key} must be public");
                $this->assertNotSame(403, $status, "{$key} must be public");

                continue;
            }

            foreach (self::ROLES as $role) {
                $url = '/'.strtr($uri, $this->routeIds());
                $user = User::factory()->state(['role' => $role])->create();
                $token = $user->createToken('spa')->plainTextToken;
                $this->app['auth']->forgetGuards();

                $status = $this->json($method, $url, [], ['Authorization' => 'Bearer '.$token])->getStatusCode();

                if (in_array($role, $allowed, true)) {
                    $this->assertNotSame(403, $status, "{$key} should be allowed for {$role}");
                    $this->assertNotSame(401, $status, "{$key} should be allowed for {$role}");
                } else {
                    $this->assertSame(403, $status, "{$key} should be FORBIDDEN for {$role}");
                }
            }

            $this->app['auth']->forgetGuards();
            $this->assertSame(401, $this->json($method, '/'.strtr($uri, $this->routeIds()))->getStatusCode(), "{$key} must require login");
        }
    }
}
