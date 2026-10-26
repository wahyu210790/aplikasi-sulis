<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\ListUsersRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListUsersRequest $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($role = $request->validated('role')) {
            $query->where('role', $role);
        }
        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }

        $query->orderBy($request->validated('sort') ?? 'name', $request->validated('direction') ?? 'asc')
            ->orderBy('id');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), UserResource::class, $request);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'role' => $request->validated('role'),
                'password' => $request->validated('password'),
                'is_active' => true,
            ]);

            $this->audit->log(
                AuditAction::USER_CREATED,
                $user,
                "Menambah pengguna {$user->name} ({$user->role->label()})",
                null,
                $this->snapshot($user),
            );

            return $user;
        });

        return response()->json(['data' => (new UserResource($user))->resolve($request)], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $newRole = Role::from($request->validated('role'));
        $newActive = (bool) $request->validated('is_active');

        if ($actor->id === $user->id && ($newRole !== $user->role || ! $newActive)) {
            throw new BusinessRuleException('Anda tidak bisa menonaktifkan atau mengubah peran akun Anda sendiri.');
        }

        DB::transaction(function () use ($request, $user, $newRole, $newActive) {
            $user = User::whereKey($user->id)->lockForUpdate()->first();
            $losesOwner = $user->isOwner() && $user->is_active && ($newRole !== Role::Owner || ! $newActive);

            if ($losesOwner && User::where('role', Role::Owner)->where('is_active', true)->count() <= 1) {
                throw new BusinessRuleException('Harus ada minimal satu Owner yang aktif.');
            }

            $before = $this->snapshot($user);
            $wasActive = $user->is_active;

            $user->fill([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'role' => $newRole,
                'is_active' => $newActive,
            ])->save();

            $after = $this->snapshot($user);

            if ($wasActive && ! $newActive) {
                $user->tokens()->delete();
                $this->audit->log(AuditAction::USER_DEACTIVATED, $user, "Menonaktifkan pengguna {$user->name}");
            } elseif (! $wasActive && $newActive) {
                $this->audit->log(AuditAction::USER_ACTIVATED, $user, "Mengaktifkan pengguna {$user->name}");
            }

            unset($before['is_active'], $after['is_active']);
            if ($before !== $after) {
                $this->audit->log(AuditAction::USER_UPDATED, $user, "Mengubah data pengguna {$user->name}", $before, $after);
            }
        });

        return response()->json(['data' => (new UserResource($user->fresh()))->resolve($request)]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $temporary = Str::password(12, letters: true, numbers: true, symbols: false, spaces: false);

        DB::transaction(function () use ($user, $temporary) {
            $user->forceFill(['password' => $temporary])->save();
            $user->tokens()->delete();
            $this->audit->log(AuditAction::USER_PASSWORD_RESET, $user, "Mereset password pengguna {$user->name}");
        });

        return response()->json(['data' => ['temporary_password' => $temporary]]);
    }

    /** Fields stored in audit before/after. Never include the password. */
    private function snapshot(User $user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'is_active' => $user->is_active,
        ];
    }
}
