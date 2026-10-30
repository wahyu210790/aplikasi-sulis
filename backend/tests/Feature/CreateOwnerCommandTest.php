<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** T6.05: php artisan app:create-owner (docs/DEPLOY_V2.md step 8). */
class CreateOwnerCommandTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD_Q = 'Password (min. 8 karakter, berisi huruf dan angka)';

    public function test_creates_an_active_owner_and_audits_it_without_the_password(): void
    {
        $this->artisan('app:create-owner')
            ->expectsQuestion('Nama lengkap', '  Sulis Wahyuni ')
            ->expectsQuestion('Email', ' Sulis@BestEngineer.CO.ID ')
            ->expectsQuestion(self::PASSWORD_Q, 'RahasiaKuat8')
            ->expectsQuestion('Ulangi password', 'RahasiaKuat8')
            ->expectsOutput('Owner Sulis Wahyuni <sulis@bestengineer.co.id> berhasil dibuat. Silakan masuk di aplikasi.')
            ->assertSuccessful();

        $user = User::sole();
        $this->assertSame('Sulis Wahyuni', $user->name);
        $this->assertSame('sulis@bestengineer.co.id', $user->email);
        $this->assertSame(Role::Owner, $user->role);
        $this->assertTrue($user->is_active);
        $this->assertTrue(Hash::check('RahasiaKuat8', $user->password));

        $log = AuditLog::where('action', AuditAction::USER_CREATED)->sole();
        $this->assertNull($log->user_id);
        $this->assertSame($user->id, $log->subject_id);
        $this->assertSame('Menambah pengguna Sulis Wahyuni (Owner) lewat perintah server', $log->summary);
        $this->assertStringNotContainsString('RahasiaKuat8', json_encode($log->changes));
        $this->assertStringNotContainsString('password', json_encode($log->changes));

        $this->postJson('/api/v1/auth/login', ['email' => 'sulis@bestengineer.co.id', 'password' => 'RahasiaKuat8'])->assertOk();
    }

    public function test_name_and_email_options_skip_those_questions(): void
    {
        $this->artisan('app:create-owner', ['--name' => 'Bos Wahyu', '--email' => 'wahyu@contoh.id'])
            ->expectsQuestion(self::PASSWORD_Q, 'Sandi12345')
            ->expectsQuestion('Ulangi password', 'Sandi12345')
            ->assertSuccessful();

        $this->assertSame(Role::Owner, User::where('email', 'wahyu@contoh.id')->sole()->role);
    }

    public function test_the_password_can_never_be_given_as_an_option(): void
    {
        $options = Artisan::all()['app:create-owner']->getDefinition()->getOptions();

        $this->assertArrayHasKey('name', $options);
        $this->assertArrayHasKey('email', $options);
        $this->assertArrayNotHasKey('password', $options);
    }

    public function test_asks_before_adding_a_second_owner(): void
    {
        User::factory()->owner()->create();

        $this->artisan('app:create-owner', ['--name' => 'Owner Dua', '--email' => 'dua@contoh.id'])
            ->expectsConfirmation('Sudah ada 1 Owner aktif. Tetap tambah Owner baru?', 'no')
            ->expectsOutput('Dibatalkan. Tidak ada akun yang dibuat.')
            ->assertFailed();
        $this->assertSame(1, User::count());

        $this->artisan('app:create-owner', ['--name' => 'Owner Dua', '--email' => 'dua@contoh.id'])
            ->expectsConfirmation('Sudah ada 1 Owner aktif. Tetap tambah Owner baru?', 'yes')
            ->expectsQuestion(self::PASSWORD_Q, 'Sandi12345')
            ->expectsQuestion('Ulangi password', 'Sandi12345')
            ->assertSuccessful();
        $this->assertSame(2, User::where('role', Role::Owner)->count());
    }

    /** @return array<string, array{0: string, 1: string, 2: string, 3: string}> */
    public static function invalidInput(): array
    {
        return [
            'password too short' => ['Owner', 'a@contoh.id', 'Abc1234', 'Abc1234'],
            'password without a digit' => ['Owner', 'a@contoh.id', 'SandiTanpaAngka', 'SandiTanpaAngka'],
            'password without a letter' => ['Owner', 'a@contoh.id', '1234567890', '1234567890'],
            'confirmation differs' => ['Owner', 'a@contoh.id', 'Sandi12345', 'Sandi12346'],
            'bad email' => ['Owner', 'bukan-email', 'Sandi12345', 'Sandi12345'],
            'name too short' => ['O', 'a@contoh.id', 'Sandi12345', 'Sandi12345'],
            'email already used' => ['Owner', 'GUDANG@contoh.id', 'Sandi12345', 'Sandi12345'],
        ];
    }

    #[DataProvider('invalidInput')]
    public function test_invalid_input_creates_nothing(string $name, string $email, string $password, string $confirmation): void
    {
        User::factory()->gudang()->create(['email' => 'gudang@contoh.id']);

        $this->artisan('app:create-owner', ['--name' => $name, '--email' => $email])
            ->expectsQuestion(self::PASSWORD_Q, $password)
            ->expectsQuestion('Ulangi password', $confirmation)
            ->expectsOutput('Tidak ada akun yang dibuat.')
            ->assertFailed();

        $this->assertSame(0, User::where('role', Role::Owner)->count());
        $this->assertSame(0, AuditLog::count());
    }
}
