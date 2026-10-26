<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * Standard list envelope (docs/desain-v2.md B9.1):
 * { "data": [...], "meta": { "current_page", "last_page", "per_page", "total" } }
 * Lookup lists (?all=1, for dropdowns) use all(): { "data": [...] } without meta.
 */
final class ApiPaginator
{
    public const DEFAULT_PER_PAGE = 20;

    public const MAX_PER_PAGE = 100;

    public const MAX_ALL = 500;

    public static function perPage(Request $request): int
    {
        $perPage = (int) $request->query('per_page', self::DEFAULT_PER_PAGE);

        return max(1, min(self::MAX_PER_PAGE, $perPage));
    }

    /** @param class-string<JsonResource> $resourceClass */
    public static function respond(LengthAwarePaginator $paginator, string $resourceClass, Request $request): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($paginator->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /** @param class-string<JsonResource> $resourceClass */
    public static function all(Collection $items, string $resourceClass, Request $request): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($items)->resolve($request),
        ]);
    }
}
