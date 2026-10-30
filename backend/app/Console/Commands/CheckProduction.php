<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * T6.05: READ-ONLY check of the server settings after a deploy (docs/DEPLOY_V2.md step 9).
 * Changes nothing. Exit code 1 when any check fails.
 */
class CheckProduction extends Command
{
    protected $signature = 'app:check-production';

    protected $description = 'Memeriksa pengaturan server produksi (hanya membaca, tidak mengubah apa pun)';

    public function handle(Migrator $migrator): int
    {
        $checks = [
            'APP_ENV=production' => app()->isProduction(),
            'APP_DEBUG=false (detail error tidak tampil)' => ! config('app.debug'),
            'APP_KEY terisi' => filled(config('app.key')),
            'APP_URL memakai https://' => Str::startsWith((string) config('app.url'), 'https://'),
            'LOG_CHANNEL=daily, LOG_LEVEL bukan debug' => config('logging.default') === 'daily'
                && config('logging.channels.daily.level') !== 'debug',
            'Database MySQL/MariaDB' => in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true),
        ];

        try {
            $files = $migrator->getMigrationFiles(database_path('migrations'));
            $ran = $migrator->repositoryExists() ? $migrator->getRepository()->getRan() : [];
            $pending = array_diff(array_keys($files), $ran);
            $checks['Semua migrasi sudah dijalankan'] = $migrator->repositoryExists() && $pending === [];
            $checks['Ada minimal 1 Owner aktif'] = User::where('role', Role::Owner)->where('is_active', true)->exists();
            $checks['Tidak ada akun demo (@sulis.test)'] = ! User::where('email', 'like', '%@sulis.test')->exists();
        } catch (Throwable) {
            $checks['Koneksi database'] = false;
        }

        $failed = 0;
        foreach ($checks as $label => $ok) {
            $this->line(($ok ? '[OK]    ' : '[GAGAL] ').$label);
            $failed += $ok ? 0 : 1;
        }

        if ($failed > 0) {
            $this->error("{$failed} pemeriksaan gagal. Perbaiki dulu sebelum aplikasi dipakai.");

            return self::FAILURE;
        }

        $this->info('Semua pemeriksaan lulus.');

        return self::SUCCESS;
    }
}
