<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * T6.04/T6.05: creates the first (or an extra) Owner on the server, docs/DEPLOY_V2.md step 8.
 * The password is ONLY asked hidden (never an option), so it is not saved in the shell history.
 * Same rules as StoreUserRequest. Audited as user.created without an actor.
 */
class CreateOwner extends Command
{
    protected $signature = 'app:create-owner
        {--name= : Nama lengkap Owner}
        {--email= : Email untuk masuk}';

    protected $description = 'Membuat akun Owner baru (password ditanyakan secara tersembunyi)';

    public function handle(AuditLogger $audit): int
    {
        $activeOwners = User::where('role', Role::Owner)->where('is_active', true)->count();
        if ($activeOwners > 0
            && ! $this->confirm("Sudah ada {$activeOwners} Owner aktif. Tetap tambah Owner baru?", false)) {
            $this->warn('Dibatalkan. Tidak ada akun yang dibuat.');

            return self::FAILURE;
        }

        $data = [
            'name' => trim((string) ($this->option('name') ?? $this->ask('Nama lengkap'))),
            'email' => Str::lower(trim((string) ($this->option('email') ?? $this->ask('Email')))),
            'password' => (string) $this->secret('Password (min. 8 karakter, berisi huruf dan angka)'),
            'password_confirmation' => (string) $this->secret('Ulangi password'),
        ];

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:150', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'max:255', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }
            $this->warn('Tidak ada akun yang dibuat.');

            return self::FAILURE;
        }

        $user = DB::transaction(function () use ($data, $audit) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => Role::Owner,
                'password' => $data['password'],
                'is_active' => true,
            ]);

            $audit->log(
                AuditAction::USER_CREATED,
                $user,
                "Menambah pengguna {$user->name} (Owner) lewat perintah server",
                null,
                ['name' => $user->name, 'email' => $user->email, 'role' => $user->role->value, 'is_active' => true],
            );

            return $user;
        });

        $this->info("Owner {$user->name} <{$user->email}> berhasil dibuat. Silakan masuk di aplikasi.");

        return self::SUCCESS;
    }
}
