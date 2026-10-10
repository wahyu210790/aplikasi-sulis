<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\User;
$user = User::factory()->create(['role' => 'warehouse']);
echo "Created user id {$user->id} role {$user->role}\n";
