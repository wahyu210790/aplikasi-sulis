<?php

namespace App\Services;

use App\Enums\MovementType;

/** What a StockLedger::apply() call is about (docs/desain-v2.md B4.2). */
final class MovementContext
{
    public function __construct(
        public readonly MovementType $type,
        public readonly string $movementDate,
        public readonly int $userId,
        public readonly ?int $projectId = null,
        public readonly ?int $stockTransactionId = null,
        public readonly ?string $notes = null,
    ) {}
}
