<?php

namespace App\Services\Import;

use App\Exceptions\BusinessRuleException;
use App\Exceptions\ImportRowsException;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use App\Support\Dec;
use App\Support\Xlsx;
use Illuminate\Support\Facades\DB;

/**
 * Product import from .xlsx (docs/desain-v2.md B5.7).
 * Columns: sku*, nama*, kategori*, satuan*, stok_minimum, catatan.
 * ALL rows are validated first; if any row is wrong NOTHING is saved.
 * Unknown categories/units are created; an existing sku is updated (is_active is kept).
 */
class ProductImporter
{
    public const HEADERS = ['sku', 'nama', 'kategori', 'satuan', 'stok_minimum', 'catatan'];

    public const REQUIRED_HEADERS = ['sku', 'nama', 'kategori', 'satuan'];

    public const MAX_ROWS = 2000;

    public const MAX_ERRORS = 100;

    /** @var list<array{row: int, column: string, message: string}> */
    private array $errors = [];

    private int $errorCount = 0;

    public function __construct(private readonly AuditLogger $audit) {}

    /** Header row + one example row for the template download. */
    public static function templateRows(): array
    {
        return [
            ['sku*', 'nama*', 'kategori*', 'satuan*', 'stok_minimum', 'catatan'],
            ['KBL-NYM-2X15', 'Kabel NYM 2x1.5', 'Kabel', 'meter', 50, 'Contoh: hapus baris ini sebelum impor'],
        ];
    }

    /** @return array{created: int, updated: int, skipped: int, categories_created: list<string>, units_created: list<string>} */
    public function import(string $path, string $fileName, User $actor): array
    {
        $sheet = Xlsx::readFirstSheet($path);
        if ($sheet === []) {
            throw new BusinessRuleException('File kosong. Gunakan template dari tombol "Unduh Template".');
        }

        $columns = $this->readHeader($sheet[1] ?? []);
        unset($sheet[1]);

        $rows = [];
        foreach ($sheet as $number => $cells) {
            $values = [];
            foreach ($columns as $name => $index) {
                $values[$name] = $cells[$index] ?? '';
            }
            if (implode('', $values) === '') {
                continue; // empty row: ignored
            }
            $rows[$number] = $values;
        }

        if ($rows === []) {
            throw new BusinessRuleException('File tidak berisi data barang.');
        }
        if (count($rows) > self::MAX_ROWS) {
            throw new BusinessRuleException('Maksimal 2.000 baris data per file. Pecah file menjadi beberapa bagian.');
        }

        $plan = $this->validateRows($rows);

        if ($this->errorCount > 0) {
            throw new ImportRowsException($this->errors, $this->errorCount);
        }

        return DB::transaction(fn () => $this->save($plan, $fileName, $actor));
    }

    /** @return array<string, int> column name => cell index */
    private function readHeader(array $cells): array
    {
        $columns = [];
        foreach ($cells as $index => $text) {
            $name = str_replace([' ', '*'], ['_', ''], mb_strtolower(trim($text)));
            if (in_array($name, self::HEADERS, true) && ! isset($columns[$name])) {
                $columns[$name] = $index;
            }
        }

        foreach (self::REQUIRED_HEADERS as $required) {
            if (! isset($columns[$required])) {
                $this->addError(1, $required, "Kolom \"{$required}\" tidak ditemukan di baris judul. Gunakan template dari tombol \"Unduh Template\".");
            }
        }
        if ($this->errorCount > 0) {
            throw new ImportRowsException($this->errors, $this->errorCount);
        }

        return $columns;
    }

    private function validateRows(array $rows): array
    {
        $categories = [];
        foreach (Category::all() as $category) {
            $categories[mb_strtolower($category->name)] = $category;
        }
        $unitsByName = [];
        $unitsBySymbol = [];
        foreach (Unit::all() as $unit) {
            $unitsByName[mb_strtolower($unit->name)] = $unit;
            $unitsBySymbol[mb_strtolower($unit->symbol)] = $unit;
        }
        $products = [];
        foreach (Product::all() as $product) {
            $products[mb_strtolower($product->sku)] = $product;
        }

        $newCategories = [];   // lowercase name => name as written
        $newUnits = [];        // lowercase name => ['name' => ..., 'symbol' => ...]
        $newUnitSymbols = [];  // lowercase symbol => true
        $seenSkus = [];        // lowercase sku => row number
        $plan = [];

        foreach ($rows as $number => $row) {
            $ok = true;

            $sku = mb_strtoupper($row['sku']);
            if ($sku === '') {
                $ok = $this->addError($number, 'sku', 'SKU wajib diisi.');
            } elseif (mb_strlen($sku) > 50) {
                $ok = $this->addError($number, 'sku', 'SKU maksimal 50 karakter.');
            } elseif (! preg_match('/^[A-Z0-9\-\._\/]+$/', $sku)) {
                $ok = $this->addError($number, 'sku', 'SKU hanya boleh berisi huruf, angka, dan tanda - . _ /');
            } elseif (isset($seenSkus[mb_strtolower($sku)])) {
                $ok = $this->addError($number, 'sku', "SKU {$sku} sudah ada di baris {$seenSkus[mb_strtolower($sku)]}.");
            } else {
                $seenSkus[mb_strtolower($sku)] = $number;
            }

            $name = $row['nama'];
            if ($name === '') {
                $ok = $this->addError($number, 'nama', 'Nama wajib diisi.');
            } elseif (mb_strlen($name) < 2 || mb_strlen($name) > 150) {
                $ok = $this->addError($number, 'nama', 'Nama harus 2 sampai 150 karakter.');
            }

            $categoryName = $row['kategori'];
            $categoryKey = mb_strtolower($categoryName);
            if ($categoryName === '') {
                $ok = $this->addError($number, 'kategori', 'Kategori wajib diisi.');
            } elseif (mb_strlen($categoryName) > 100) {
                $ok = $this->addError($number, 'kategori', 'Kategori maksimal 100 karakter.');
            } elseif (isset($categories[$categoryKey]) && ! $categories[$categoryKey]->is_active) {
                $ok = $this->addError($number, 'kategori', "Kategori \"{$categories[$categoryKey]->name}\" sudah nonaktif.");
            }

            $unitName = $row['satuan'];
            $unitKey = mb_strtolower($unitName);
            $unit = $unitsByName[$unitKey] ?? $unitsBySymbol[$unitKey] ?? null;
            if ($unitName === '') {
                $ok = $this->addError($number, 'satuan', 'Satuan wajib diisi.');
            } elseif (mb_strlen($unitName) > 50) {
                $ok = $this->addError($number, 'satuan', 'Satuan maksimal 50 karakter.');
            } elseif ($unit !== null && ! $unit->is_active) {
                $ok = $this->addError($number, 'satuan', "Satuan \"{$unit->name}\" sudah nonaktif.");
            } elseif ($unit === null && ! isset($newUnits[$unitKey])) {
                $symbol = mb_substr($unitKey, 0, 20);
                if (isset($unitsBySymbol[$symbol]) || isset($newUnitSymbols[$symbol])) {
                    $ok = $this->addError($number, 'satuan', "Satuan \"{$unitName}\" tidak bisa dibuat otomatis karena simbol \"{$symbol}\" sudah dipakai. Buat satuan ini dulu di menu Satuan.");
                }
            }

            $minStock = str_replace(',', '.', $row['stok_minimum'] ?? '');
            $minStock = $minStock === '' ? '0' : $minStock;
            if (! preg_match('/^\d{1,12}(\.\d{1,3})?$/', $minStock)) {
                $ok = $this->addError($number, 'stok_minimum', 'Stok minimum harus angka 0 atau lebih, maksimal 3 angka di belakang koma.');
            }

            $notes = $row['catatan'] ?? '';
            if (mb_strlen($notes) > 500) {
                $ok = $this->addError($number, 'catatan', 'Catatan maksimal 500 karakter.');
            }

            if (! $ok) {
                continue;
            }

            // Remember new categories/units only for valid rows.
            if (! isset($categories[$categoryKey]) && ! isset($newCategories[$categoryKey])) {
                $newCategories[$categoryKey] = $categoryName;
            }
            if ($unit === null && ! isset($newUnits[$unitKey])) {
                $symbol = mb_substr($unitKey, 0, 20);
                $newUnits[$unitKey] = ['name' => $unitName, 'symbol' => $symbol];
                $newUnitSymbols[$symbol] = true;
            }

            $plan[] = [
                'sku' => $sku,
                'name' => $name,
                'category_key' => $categoryKey,
                'unit_key' => $unit !== null ? null : $unitKey,
                'unit_id' => $unit?->id,
                'min_stock' => $minStock,
                'notes' => $notes === '' ? null : $notes,
                'existing' => $products[mb_strtolower($sku)] ?? null,
            ];
        }

        return ['rows' => $plan, 'new_categories' => $newCategories, 'new_units' => $newUnits, 'categories' => $categories];
    }

    private function save(array $plan, string $fileName, User $actor): array
    {
        $categoryIds = [];
        foreach ($plan['categories'] as $key => $category) {
            $categoryIds[$key] = $category->id;
        }
        foreach ($plan['new_categories'] as $key => $name) {
            $categoryIds[$key] = Category::create(['name' => $name, 'is_active' => true])->id;
        }

        $unitIds = [];
        foreach ($plan['new_units'] as $key => $unit) {
            $unitIds[$key] = Unit::create(['name' => $unit['name'], 'symbol' => $unit['symbol'], 'is_active' => true])->id;
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($plan['rows'] as $row) {
            $values = [
                'sku' => $row['sku'],
                'name' => $row['name'],
                'category_id' => $categoryIds[$row['category_key']],
                'unit_id' => $row['unit_id'] ?? $unitIds[$row['unit_key']],
                'min_stock' => $row['min_stock'],
                'notes' => $row['notes'],
            ];

            /** @var Product|null $existing */
            $existing = $row['existing'];
            if ($existing === null) {
                Product::create([...$values, 'is_active' => true]);
                $created++;

                continue;
            }

            $same = $existing->sku === $values['sku']
                && $existing->name === $values['name']
                && $existing->category_id === $values['category_id']
                && $existing->unit_id === $values['unit_id']
                && Dec::cmp($existing->min_stock, $values['min_stock']) === 0
                && $existing->notes === $values['notes'];

            if ($same) {
                $skipped++;

                continue;
            }

            $existing->fill($values)->save();
            $updated++;
        }

        $result = [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'categories_created' => array_values($plan['new_categories']),
            'units_created' => array_values(array_map(fn ($unit) => $unit['name'], $plan['new_units'])),
        ];

        // B5.7: exactly one audit entry per import.
        $this->audit->log(
            AuditAction::PRODUCT_IMPORTED,
            null,
            "Impor barang dari {$fileName}: {$created} baru, {$updated} diubah, {$skipped} tidak berubah",
            null,
            ['file' => $fileName, ...$result],
            $actor,
        );

        return $result;
    }

    /** Always returns false so callers can write: $ok = $this->addError(...). */
    private function addError(int $row, string $column, string $message): bool
    {
        $this->errorCount++;
        if (count($this->errors) < self::MAX_ERRORS) {
            $this->errors[] = ['row' => $row, 'column' => $column, 'message' => $message];
        }

        return false;
    }
}
