<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * QA bug #2: a slow save could reach the server twice (the network re-sent the same POST), and the second copy
 * answered "Nama sudah digunakan." although the first one had saved. The SPA sends a new random
 * "Idempotency-Key" header with every change (POST/PUT/DELETE). The FIRST request with a key is processed;
 * a copy with the same key (same user) waits for it and then gets the SAME answer again, without running twice.
 * Requests without the header, and GET/HEAD, are not touched. Answers are kept for 1 hour.
 */
class IdempotentRequest
{
    public const HEADER = 'Idempotency-Key';

    public const REPLAYED_HEADER = 'Idempotent-Replayed';

    /** How long a stored answer can be replayed. */
    public const TTL_SECONDS = 3600;

    /** How long a copy waits for the first request to finish. */
    public const WAIT_SECONDS = 30;

    public function handle(Request $request, Closure $next): Response
    {
        $key = (string) $request->header(self::HEADER, '');
        $user = $request->user();

        if ($request->isMethodSafe() || $key === '' || ! $user) {
            return $next($request);
        }

        if (! preg_match('/^[A-Za-z0-9-]{16,100}$/', $key)) {
            return response()->json(['message' => 'Kunci permintaan tidak valid. Muat ulang halaman lalu coba lagi.'], 422);
        }

        $cacheKey = 'idem:'.$user->id.':'.$key;
        $fingerprint = sha1($request->method().' '.$request->path().' '.$request->getContent());
        $lock = Cache::lock($cacheKey.':lock', self::WAIT_SECONDS * 2);

        try {
            $lock->block(self::WAIT_SECONDS);
        } catch (LockTimeoutException) {
            return response()->json(['message' => 'Permintaan yang sama masih diproses. Tunggu sebentar lalu muat ulang halaman.'], 409);
        }

        try {
            $stored = Cache::get($cacheKey);
            if (is_array($stored)) {
                if ($stored['fingerprint'] !== $fingerprint) {
                    return response()->json(['message' => 'Kunci permintaan sudah dipakai untuk data lain. Muat ulang halaman lalu coba lagi.'], 422);
                }

                return response($stored['body'], $stored['status'], array_filter([
                    'Content-Type' => $stored['type'],
                    self::REPLAYED_HEADER => 'true',
                ]));
            }

            $response = $next($request);

            if ($this->storable($response)) {
                Cache::put($cacheKey, [
                    'fingerprint' => $fingerprint,
                    'status' => $response->getStatusCode(),
                    'type' => $response->headers->get('Content-Type'),
                    'body' => $response->getContent(),
                ], self::TTL_SECONDS);
            }

            return $response;
        } finally {
            $lock->release();
        }
    }

    /** Only final answers are kept: not server errors, session errors or "too many requests" (those may be retried). */
    private function storable(Response $response): bool
    {
        if ($response instanceof BinaryFileResponse || $response instanceof StreamedResponse) {
            return false;
        }
        $status = $response->getStatusCode();

        return $status < 500 && ! in_array($status, [401, 419, 429], true);
    }
}
