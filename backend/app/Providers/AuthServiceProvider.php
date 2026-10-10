<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Simple role based gates for inventory core
        Gate::define('inventory-transaction', function ($user) {
            // Owner and Warehouse can perform transactions, Finance cannot
            return in_array($user->role, ['owner', 'warehouse']);
        });
        // Purchasing gate: owner and finance can manage purchases
        Gate::define('purchasing', function ($user) {
            return in_array($user->role, ['owner', 'finance']);
        });
        // Stock Opname gate: owner and warehouse can manage stock opnames
        Gate::define('stock-opname', function ($user) {
            return in_array($user->role, ['owner', 'warehouse']);
        });

    }
}
?>
