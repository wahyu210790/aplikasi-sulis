<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // docs/desain-v2.md B11 — rate limits
        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(5)->by('login-email:'.$email.'|'.$request->ip()),
                Limit::perHour(30)->by('login-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by('api:'.($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('imports', function (Request $request) {
            return Limit::perHour(10)->by('imports:'.($request->user()?->id ?: $request->ip()));
        });
    }
}
