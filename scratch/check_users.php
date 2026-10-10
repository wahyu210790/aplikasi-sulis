<?php
// Temporary script to read demo users from the Laravel database (read‑only).
// Adjusted path to vendor autoload from the project root.
require __DIR__.'/../backend/vendor/autoload.php';
$app = require __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$emails = ['owner@example.com','warehouse@example.com','finance@example.com'];
foreach ($emails as $email) {
    $user = App\Models\User::where('email', $email)->first(['email','role']);
    if ($user) {
        echo "$email: FOUND role={$user->role}\n";
    } else {
        echo "$email: NOT FOUND\n";
    }
}
?>
