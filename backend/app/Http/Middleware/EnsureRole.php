<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Usage in routes: ->middleware('role:owner,finance')
 * 403 "Anda tidak memiliki akses untuk tindakan ini." when the user's role is not listed.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthenticationException;
        }

        $allowed = array_map(fn (string $role) => Role::from($role), $roles);

        if (! $user->hasRole(...$allowed)) {
            throw new AccessDeniedHttpException;
        }

        return $next($request);
    }
}
