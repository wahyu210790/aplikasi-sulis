<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * QA bug #11: the audit log says what really happened — refused logins of deactivated accounts,
 * "Menonaktifkan / Mengaktifkan" instead of "Mengubah" for a status switch, and ended sessions on deactivation.
 */
class AuditReadabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_refused_login_of_a_deactivated_account_is_logged(): void
    {
        $user = User::factory()->inactive()->create(['name' => 'Rina', 'email' => 'off@sulis.test']);

        $this->postJson('/api/v1/auth/login', ['email' => 'off@sulis.test', 'password' => 'Password123'])
            ->assertStatus(403)
            ->assertExactJson(['message' => 'Akun Anda dinonaktifkan. Hubungi Owner.']);

        $log = AuditLog::where('action', AuditAction::AUTH_LOGIN_FAILED)->sole();
        $this->assertSame('Percobaan masuk ditolak: akun Rina dinonaktifkan', $log->summary);
        $this->assertSame($user->id, $log->user_id);
        $this->assertSame($user->id, $log->subject_id);
        $this->assertSame(0, $user->tokens()->count(), 'no token for a deactivated account');
    }

    public function test_switching_only_the_status_says_so(): void
    {
        Sanctum::actingAs(User::factory()->owner()->create());
        $category = Category::factory()->create(['name' => 'Kabel', 'is_active' => true]);

        $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'Kabel', 'is_active' => false])->assertOk();
        $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'Kabel', 'is_active' => true])->assertOk();
        $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'Kabel Listrik', 'is_active' => false])->assertOk();

        $this->assertSame(
            ['Menonaktifkan kategori Kabel', 'Mengaktifkan kategori Kabel', 'Mengubah kategori Kabel Listrik'],
            AuditLog::where('action', AuditAction::CATEGORY_UPDATED)->orderBy('id')->pluck('summary')->all(),
        );

        $supplier = Supplier::factory()->create(['name' => 'CV Maju', 'is_active' => true]);
        $this->putJson("/api/v1/suppliers/{$supplier->id}", ['name' => 'CV Maju', 'phone' => $supplier->phone, 'address' => $supplier->address, 'notes' => $supplier->notes, 'is_active' => false])->assertOk();
        $this->assertSame('Menonaktifkan pemasok CV Maju', AuditLog::where('action', AuditAction::SUPPLIER_UPDATED)->sole()->summary);
    }

    public function test_deactivating_a_user_mentions_the_ended_sessions(): void
    {
        Sanctum::actingAs(User::factory()->owner()->create());
        $user = User::factory()->gudang()->create(['name' => 'Budi', 'email' => 'budi@sulis.test']);
        $user->createToken('spa');

        $this->putJson("/api/v1/users/{$user->id}", ['name' => 'Budi', 'email' => 'budi@sulis.test', 'role' => 'gudang', 'is_active' => false])->assertOk();

        $this->assertSame('Menonaktifkan pengguna Budi; semua sesi masuknya diakhiri', AuditLog::where('action', AuditAction::USER_DEACTIVATED)->sole()->summary);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_edit_verb(): void
    {
        $this->assertSame('Menonaktifkan', AuditLogger::editVerb(['name' => 'A', 'is_active' => true], ['name' => 'A', 'is_active' => false]));
        $this->assertSame('Mengaktifkan', AuditLogger::editVerb(['is_active' => false], ['is_active' => true]));
        $this->assertSame('Mengubah', AuditLogger::editVerb(['name' => 'A', 'is_active' => true], ['name' => 'B', 'is_active' => false]));
        $this->assertSame('Mengubah', AuditLogger::editVerb(['name' => 'A'], ['name' => 'B']));
    }
}
