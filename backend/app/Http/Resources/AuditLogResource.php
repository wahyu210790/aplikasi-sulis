<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One audit log row (docs/desain-v2.md B3.16, B8). Owner only, so changes may contain money values.
 * Load 'user'. user is null for a failed login of an unknown email.
 *
 * @mixin AuditLog
 */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'summary' => $this->summary,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'user' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name, 'role' => $this->user->role->value] : null,
            'changes' => $this->changes,
            'ip' => $this->ip,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
