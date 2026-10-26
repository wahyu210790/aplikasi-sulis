<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * LOCAL DEVELOPMENT ONLY. Never creates anything in production.
     * Password for all demo users: Password123
     * Demo master data (categories, units, products, suppliers, projects) is for trying the app locally.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $users = [
            ['name' => 'Owner Demo', 'email' => 'owner@sulis.test', 'role' => Role::Owner],
            ['name' => 'Gudang Demo', 'email' => 'gudang@sulis.test', 'role' => Role::Gudang],
            ['name' => 'Finance Demo', 'email' => 'finance@sulis.test', 'role' => Role::Finance],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                ['name' => $user['name'], 'role' => $user['role'], 'password' => 'Password123', 'is_active' => true],
            );
        }

        DB::transaction(fn () => $this->seedMasterData());
    }

    private function seedMasterData(): void
    {
        $categories = [];
        foreach (['Kabel', 'Pipa', 'Lampu', 'Saklar & Stop Kontak'] as $name) {
            $categories[$name] = Category::firstOrCreate(['name' => $name], ['is_active' => true]);
        }

        $units = [];
        foreach ([['meter', 'm'], ['batang', 'btg'], ['pcs', 'pcs'], ['roll', 'roll']] as [$name, $symbol]) {
            $units[$name] = Unit::firstOrCreate(['name' => $name], ['symbol' => $symbol, 'is_active' => true]);
        }

        $products = [
            ['KBL-NYM-2X15', 'Kabel NYM 2x1.5', 'Kabel', 'meter', '50'],
            ['KBL-NYM-3X25', 'Kabel NYM 3x2.5', 'Kabel', 'meter', '50'],
            ['PIPA-PVC-34', 'Pipa PVC 3/4"', 'Pipa', 'batang', '20'],
            ['LMP-LED-12W', 'Lampu LED 12W', 'Lampu', 'pcs', '10'],
            ['STK-ARD-2', 'Stop Kontak Arde 2 Lubang', 'Saklar & Stop Kontak', 'pcs', '0'],
            ['ISO-HTM', 'Isolasi Hitam', 'Kabel', 'roll', '5'],
        ];
        foreach ($products as [$sku, $name, $category, $unit, $minStock]) {
            Product::firstOrCreate(['sku' => $sku], [
                'name' => $name,
                'category_id' => $categories[$category]->id,
                'unit_id' => $units[$unit]->id,
                'min_stock' => $minStock,
                'is_active' => true,
            ]);
        }

        foreach ([['Toko Listrik Sinar Jaya', '021-5550101'], ['CV Maju Elektrik', '0812-0000-0002']] as [$name, $phone]) {
            Supplier::firstOrCreate(['name' => $name], ['phone' => $phone, 'is_active' => true]);
        }

        $owner = User::where('email', 'owner@sulis.test')->first();
        $projects = [
            ['PRJ-DEMO-1', 'Instalasi Listrik Gedung A', 'PT Contoh Satu', 'Jakarta', 150000000, ProjectStatus::Aktif],
            ['PRJ-DEMO-2', 'Renovasi Ruko B', 'Bapak Contoh', 'Bekasi', 45000000, ProjectStatus::Selesai],
        ];
        foreach ($projects as [$code, $name, $client, $location, $value, $status]) {
            Project::firstOrCreate(['code' => $code], [
                'name' => $name,
                'client_name' => $client,
                'location' => $location,
                'contract_value' => $value,
                'status' => $status,
                'created_by' => $owner->id,
            ]);
        }
    }
}
