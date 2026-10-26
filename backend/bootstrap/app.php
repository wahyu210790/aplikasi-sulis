<?php

use App\Exceptions\BusinessRuleException;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Pure API application: never redirect unauthenticated requests to a named 'login' route
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'active' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $isApi = fn (Request $request) => $request->is('api/*') || $request->expectsJson();

        $exceptions->shouldRenderJsonWhen($isApi);

        $exceptions->render(function (Throwable $e, Request $request) use ($isApi) {
            if (! $isApi($request)) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => $e->validator->errors()->first(),
                    'errors' => $e->errors(),
                ], 422);
            }

            if ($e instanceof BusinessRuleException) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Sesi Anda telah berakhir. Silakan masuk kembali.'], 401);
            }

            if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                return response()->json(['message' => 'Anda tidak memiliki akses untuk tindakan ini.'], 403);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json(['message' => 'Data tidak ditemukan.'], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Metode tidak diizinkan.'], 405);
            }

            if ($e instanceof ThrottleRequestsException) {
                $seconds = (int) ($e->getHeaders()['Retry-After'] ?? 60);

                return response()->json(
                    ['message' => "Terlalu banyak percobaan. Coba lagi dalam {$seconds} detik."],
                    429,
                    $e->getHeaders(),
                );
            }

            if ($e instanceof HttpExceptionInterface) {
                $messages = [
                    401 => 'Sesi Anda telah berakhir. Silakan masuk kembali.',
                    403 => 'Anda tidak memiliki akses untuk tindakan ini.',
                    404 => 'Data tidak ditemukan.',
                    405 => 'Metode tidak diizinkan.',
                ];
                $status = $e->getStatusCode();

                return response()->json(
                    ['message' => $messages[$status] ?? 'Permintaan tidak dapat diproses.'],
                    $status,
                    $e->getHeaders(),
                );
            }

            if (! config('app.debug')) {
                return response()->json(['message' => 'Terjadi kesalahan pada server. Silakan coba lagi.'], 500);
            }

            return null; // debug mode: framework default (with trace) for developers
        });
    })->create();
