<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a business rule is violated (e.g. stok tidak cukup).
 * Rendered as HTTP 422 with body {"message": "..."} (no "errors" key).
 * The message MUST be Indonesian and user-friendly.
 */
class BusinessRuleException extends RuntimeException {}
