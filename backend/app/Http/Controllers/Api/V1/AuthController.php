<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            $this->audit->log(AuditAction::AUTH_LOGIN_FAILED, null, 'Percobaan masuk gagal untuk email '.$request->input('email'));

            throw ValidationException::withMessages(['email' => ['Email atau password salah.']]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi Owner.'], 403);
        }

        $user->tokens()->where('expires_at', '<', now())->delete();

        $expiresAt = now()->addMinutes((int) config('sanctum.expiration'));
        $token = $user->createToken('spa', ['*'], $expiresAt);

        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit->log(AuditAction::AUTH_LOGIN, $user, "{$user->name} masuk ke aplikasi", actor: $user);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'expires_at' => $expiresAt->toIso8601String(),
                'user' => (new UserResource($user))->resolve($request),
            ],
        ]);
    }

    public function logout(Request $request): Response
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        $this->audit->log(AuditAction::AUTH_LOGOUT, $user, "{$user->name} keluar dari aplikasi");

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => (new UserResource($request->user()))->resolve($request)]);
    }

    public function changePassword(ChangePasswordRequest $request): Response
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        $user->forceFill(['password' => $request->input('password')])->save();
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        $this->audit->log(AuditAction::AUTH_PASSWORD_CHANGED, $user, "{$user->name} mengganti password");

        return response()->noContent();
    }
}
