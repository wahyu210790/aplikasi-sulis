<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * The ONLY way to write audit_logs (docs/desain-v2.md B8).
 * Call it INSIDE the same DB::transaction as the change it describes.
 * Never put passwords or tokens in $before/$after.
 */
class AuditLogger
{
    public function log(
        string $action,
        ?Model $subject,
        string $summary,
        ?array $before = null,
        ?array $after = null,
        ?User $actor = null,
    ): AuditLog {
        if (! in_array($action, AuditAction::all(), true)) {
            throw new InvalidArgumentException("Unknown audit action: {$action}");
        }

        $actor ??= auth()->user();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject ? Str::snake(class_basename($subject)) : null,
            'subject_id' => $subject?->getKey(),
            'summary' => Str::limit($summary, 297),
            'changes' => ($before === null && $after === null) ? null : ['before' => $before, 'after' => $after],
            'ip' => request()?->ip(),
        ]);
    }

    /**
     * The verb for an "updated" summary (QA bug #11): when only is_active changed it says what really happened
     * ("Menonaktifkan" / "Mengaktifkan") instead of "Mengubah".
     */
    public static function editVerb(array $before, array $after): string
    {
        $changed = array_keys(array_filter($after, fn ($value, $key) => ($before[$key] ?? null) !== $value, ARRAY_FILTER_USE_BOTH));

        if ($changed === ['is_active']) {
            return $after['is_active'] ? 'Mengaktifkan' : 'Menonaktifkan';
        }

        return 'Mengubah';
    }
}
