<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => ['Email atau password salah.']]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi Owner.'], 403);
        }

        $user->tokens()->where('expires_at', '<', now())->delete();

        $expiresAt = now()->addMinutes((int) config('sanctum.expiration'));
        $token = $user->createToken('spa', ['*'], $expiresAt);

        $user->forceFill(['last_login_at' => now()])->save();

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
        $request->user()->currentAccessToken()->delete();

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

        return response()->noContent();
    }
}
