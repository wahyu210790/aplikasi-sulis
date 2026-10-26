<?php

namespace App\Services\Import;

use App\Enums\MovementType;
use App\Exceptions\BusinessRuleException;
use App\Exceptions\ImportRowsException;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Rules\BusinessDate;
use App\Services\AuditLogger;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\AuditAction;
use App\Support\Dec;
use App\Support\StockRules;
use App\Support\Xlsx;
use Illuminate\Support\Facades\DB;

/**
 * Opening stock import from .xlsx (docs/desain-v2.md B5.6, B5.7).
 * Columns: sku*, jumlah*, harga_modal*, tanggal (empty = today).
 * ALL rows are validated first; if any row is wrong NOTHING is saved.
 */
class OpeningStockImporter
{
    public const HEADERS = ['sku', 'jumlah', 'harga_modal', 'tanggal'];

    public const REQUIRED_HEADERS = ['sku', 'jumlah', 'harga_modal'];

    public const MAX_ROWS = 2000;

    public const MAX_ERRORS = 100;

    /** @var list<array{row: int, column: string, message: string}> */
    private array $errors = [];

    private int $errorCount = 0;

    public function __construct(private readonly AuditLogger $audit, private readonly StockLedger $ledger) {}

    /** Header row + one example row for the template download. */
    public static function templateRows(): array
    {
        return [
            ['sku*', 'jumlah*', 'harga_modal*', 'tanggal'],
            ['KBL-NYM-2X15', 100, 10000, now()->toDateString()],
        ];
    }

    /** @return array{created: int, updated: int, skipped: int, total_value: int} */
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
            foreach (self::HEADERS as $name) {
                $values[$name] = isset($columns[$name]) ? ($cells[$columns[$name]] ?? '') : '';
            }
            if (implode('', $values) === '') {
                continue; // empty row: ignored
            }
            $rows[$number] = $values;
        }

        if ($rows === []) {
            throw new BusinessRuleException('File tidak berisi data stok awal.');
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
        $products = [];
        foreach (Product::all() as $product) {
            $products[mb_strtolower($product->sku)] = $product;
        }
        $withMovements = array_flip(StockMovement::query()->distinct()->pluck('product_id')->all());

        $seenSkus = [];
        $plan = [];

        foreach ($rows as $number => $row) {
            $ok = true;

            $sku = mb_strtoupper($row['sku']);
            $product = $products[mb_strtolower($sku)] ?? null;
            if ($sku === '') {
                $ok = $this->addError($number, 'sku', 'SKU wajib diisi.');
            } elseif ($product === null) {
                $ok = $this->addError($number, 'sku', "SKU {$sku} tidak ditemukan. Tambahkan barangnya dulu.");
            } elseif (! $product->is_active) {
                $ok = $this->addError($number, 'sku', "Barang {$sku} sudah nonaktif.");
            } elseif (isset($seenSkus[$product->id])) {
                $ok = $this->addError($number, 'sku', "SKU {$sku} sudah ada di baris {$seenSkus[$product->id]}.");
            } elseif (isset($withMovements[$product->id])) {
                $ok = $this->addError($number, 'sku', "Stok awal {$sku} sudah pernah diisi atau barang sudah punya transaksi.");
            } else {
                $seenSkus[$product->id] = $number;
            }

            $qty = str_replace(',', '.', $row['jumlah']);
            if ($qty === '') {
                $ok = $this->addError($number, 'jumlah', 'Jumlah wajib diisi.');
            } elseif (! preg_match(StockRules::QTY_REGEX, $qty) || Dec::isZero($qty)) {
                $ok = $this->addError($number, 'jumlah', 'Jumlah harus angka lebih dari 0, maksimal 3 angka di belakang koma.');
            }

            $cost = $row['harga_modal'];
            if ($cost === '') {
                $ok = $this->addError($number, 'harga_modal', 'Harga modal wajib diisi (boleh 0).');
            } elseif (! preg_match('/^\d{1,12}$/', $cost)) {
                $ok = $this->addError($number, 'harga_modal', 'Harga modal harus bilangan bulat rupiah 0 atau lebih, tanpa titik atau koma.');
            }

            $date = $this->parseDate($row['tanggal']);
            if ($date === null) {
                $ok = $this->addError($number, 'tanggal', 'Tanggal harus berformat YYYY-MM-DD atau DD/MM/YYYY.');
            } elseif (($problem = BusinessDate::problem($date)) !== null) {
                $ok = $this->addError($number, 'tanggal', 'Tanggal '.$problem);
            }

            if ($ok) {
                $plan[] = ['product' => $product, 'qty' => Dec::qty($qty), 'unit_cost' => $cost, 'date' => $date];
            }
        }

        return $plan;
    }

    /** '' => today; accepts 2026-10-26, 26/10/2026 and 26-10-2026. Returns Y-m-d or null. */
    private function parseDate(string $text): ?string
    {
        if ($text === '') {
            return now()->toDateString();
        }
        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $text, $m)) {
            [$year, $month, $day] = [(int) $m[1], (int) $m[2], (int) $m[3]];
        } elseif (preg_match('/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/', $text, $m)) {
            [$day, $month, $year] = [(int) $m[1], (int) $m[2], (int) $m[3]];
        } else {
            return null;
        }

        return checkdate($month, $day, $year) ? sprintf('%04d-%02d-%02d', $year, $month, $day) : null;
    }

    private function save(array $plan, string $fileName, User $actor): array
    {
        $byDate = [];
        foreach ($plan as $row) {
            $byDate[$row['date']][] = [
                'product_id' => $row['product']->id,
                'qty' => $row['qty'],
                'value' => Dec::roundRupiah(Dec::mul($row['qty'], $row['unit_cost'])),
            ];
        }
        ksort($byDate);

        $created = 0;
        $totalValue = 0;
        foreach ($byDate as $date => $lines) {
            $movements = $this->ledger->apply($lines, new MovementContext(MovementType::Opening, $date, $actor->id));
            $created += $movements->count();
            $totalValue += $movements->sum('value_change');
        }

        $result = ['created' => $created, 'updated' => 0, 'skipped' => 0, 'total_value' => $totalValue];

        // B5.7: exactly one audit entry per import.
        $this->audit->log(
            AuditAction::OPENING_STOCK_IMPORTED,
            null,
            "Impor stok awal dari {$fileName}: {$created} barang",
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
