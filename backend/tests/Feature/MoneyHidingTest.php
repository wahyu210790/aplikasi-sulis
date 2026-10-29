<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\Concerns\BuildsXlsxFiles;
use Tests\TestCase;

/**
 * docs/desain-v2.md B7: Gudang never receives money keys.
 * GUDANG_ROUTES lists EVERY api route Gudang may call (taken from the route middleware). A new route that Gudang
 * can call makes test_gudang_route_list_is_complete fail until it is added here AND called in
 * test_gudang_gets_no_money_keys_from_every_route_it_can_call.
 */
class MoneyHidingTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use BuildsXlsxFiles;
    use RefreshDatabase;

    private const GUDANG_ROUTES = [
        'POST api/v1/auth/login',
        'POST api/v1/auth/logout',
        'GET api/v1/auth/me',
        'PUT api/v1/auth/password',
        'GET api/v1/categories',
        'POST api/v1/categories',
        'PUT api/v1/categories/{category}',
        'GET api/v1/units',
        'POST api/v1/units',
        'PUT api/v1/units/{unit}',
        'GET api/v1/products',
        'POST api/v1/products',
        'GET api/v1/products/{product}',
        'PUT api/v1/products/{product}',
        'GET api/v1/products/{product}/movements',
        'GET api/v1/imports/products/template',
        'POST api/v1/imports/products',
        'GET api/v1/projects',
        'GET api/v1/projects/{project}',
        'GET api/v1/projects/{project}/issued-items',
        'GET api/v1/purchases',
        'GET api/v1/purchases/{purchase}',
        'POST api/v1/purchases/{purchase}/receive',
        'POST api/v1/stock-outs',
        'POST api/v1/stock-returns',
        'GET api/v1/stock-transactions',
        'GET api/v1/stock-transactions/{stockTransaction}',
        'GET api/v1/reports/movements',
        'GET api/v1/reports/projects/{project}/materials',
        'GET api/v1/dashboard',
        'GET api/v1/stock-opnames',
        'POST api/v1/stock-opnames',
        'GET api/v1/stock-opnames/{stockOpname}',
        'PUT api/v1/stock-opnames/{stockOpname}/items',
        'POST api/v1/stock-opnames/{stockOpname}/submit',
        'POST api/v1/stock-opnames/{stockOpname}/cancel',
    ];

    /** Routes that answer without a JSON body (file download, 204 No Content): only checked for success. */
    private const NO_JSON_BODY = ['GET api/v1/imports/products/template', 'PUT api/v1/auth/password', 'POST api/v1/auth/logout'];

    private Product $product;

    /** @var list<string> routes called by callAsGudang() */
    private array $called = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->product = Product::factory()->create(['sku' => 'KBL-001', 'min_stock' => '50']);
        $this->product->stockBalance->update(['qty' => '115', 'avg_cost' => '11500', 'stock_value' => 1322500, 'has_cost' => true]);
    }

    public function test_gudang_gets_no_money_keys_from_product_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/products'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/products?low_stock=1'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/products/{$this->product->id}"));

        $this->getJson("/api/v1/products/{$this->product->id}")
            ->assertJsonPath('data.stock', ['qty' => '115.000']);
    }

    public function test_gudang_gets_no_money_keys_after_create_or_update(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());
        $payload = [
            'sku' => 'PP-001',
            'name' => 'Pipa PVC',
            'category_id' => Category::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
        ];

        $created = $this->postJson('/api/v1/products', $payload)->assertCreated();
        $this->assertNoMoneyKeys($created);

        $id = $created->json('data.id');
        $this->assertNoMoneyKeys($this->putJson("/api/v1/products/{$id}", [...$payload, 'is_active' => true]));
    }

    public function test_gudang_gets_no_money_keys_from_categories_and_units(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/categories'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/units?all=1'));
    }

    public function test_gudang_gets_no_money_keys_from_projects(): void
    {
        $project = Project::factory()->create(['contract_value' => 150000000]);
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/projects'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/projects?all=1'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/projects/{$project->id}"));
    }

    public function test_gudang_gets_no_money_keys_from_product_import(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());
        $file = $this->xlsxUpload([
            ['sku', 'nama', 'kategori', 'satuan'],
            ['KBL-001', 'Kabel A', 'Kabel', 'meter'],
            ['PP-001', 'Pipa PVC', 'Pipa', 'batang'],
        ]);

        $this->assertNoMoneyKeys($this->post('/api/v1/imports/products', ['file' => $file], ['Accept' => 'application/json']));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/products'));
    }

    public function test_gudang_gets_no_money_keys_from_any_stock_endpoint(): void
    {
        $this->travelTo('2026-10-27 10:00:00');
        $project = Project::factory()->create();
        $first = Purchase::factory()->withItem($this->product, '10', 12000)->create();
        $second = Purchase::factory()->withItem($this->product, '5', 13000)->create();
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/purchases'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/purchases/{$first->id}"));
        $this->assertNoMoneyKeys($this->postJson("/api/v1/purchases/{$first->id}/receive"));
        $this->assertNoMoneyKeys($this->postJson("/api/v1/purchases/{$second->id}/receive"));

        $body = [
            'project_id' => $project->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->product->id, 'qty' => '20']],
        ];
        $out = $this->postJson('/api/v1/stock-outs', $body);
        $this->assertNoMoneyKeys($out);
        $this->assertNoMoneyKeys($this->postJson('/api/v1/stock-returns', [...$body, 'items' => [['product_id' => $this->product->id, 'qty' => '5']]]));

        $this->assertNoMoneyKeys($this->getJson('/api/v1/stock-transactions'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/stock-transactions/'.$out->json('data.id')));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/projects/{$project->id}/issued-items"));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/products/{$this->product->id}/movements"));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/reports/movements'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/products/{$this->product->id}"));

        $this->getJson('/api/v1/reports/movements')->assertJsonCount(4, 'data');
        $this->getJson("/api/v1/projects/{$project->id}/issued-items")->assertJsonPath('data.0.qty', '15.000');
    }

    public function test_owner_and_finance_do_get_money_keys(): void
    {
        $project = Project::factory()->create(['contract_value' => 150000000]);

        foreach (['owner', 'finance'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());

            $this->getJson("/api/v1/products/{$this->product->id}")
                ->assertOk()
                ->assertJsonPath('data.stock.avg_cost', '11500.0000')
                ->assertJsonPath('data.stock.stock_value', 1322500)
                ->assertJsonPath('data.stock.has_cost', true);

            $this->getJson("/api/v1/projects/{$project->id}")
                ->assertOk()
                ->assertJsonPath('data.contract_value', 150000000);
        }
    }

    public function test_gudang_route_list_is_complete(): void
    {
        $fromMiddleware = [];
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/')) {
                continue;
            }
            $roles = null;
            foreach ($route->gatherMiddleware() as $middleware) {
                if (is_string($middleware) && preg_match('/^role:(.+)$/', $middleware, $match)) {
                    $roles = explode(',', $match[1]);
                }
            }
            if ($roles !== null && ! in_array('gudang', $roles, true)) {
                continue;
            }
            foreach (array_diff($route->methods(), ['HEAD', 'OPTIONS']) as $method) {
                $fromMiddleware[] = $method.' '.$route->uri();
            }
        }
        $listed = self::GUDANG_ROUTES;
        sort($fromMiddleware);
        sort($listed);

        $this->assertSame($listed, $fromMiddleware, 'MoneyHidingTest::GUDANG_ROUTES must list exactly the api routes Gudang can call.');
    }

    public function test_gudang_gets_no_money_keys_from_every_route_it_can_call(): void
    {
        $this->travelTo('2026-10-27 10:00:00');
        $project = Project::factory()->create(['contract_value' => 150000000]);
        $purchase = Purchase::factory()->withItem($this->product, '10', 12000)->create();
        User::factory()->gudang()->create(['email' => 'gudang@sulis.test']);
        User::factory()->owner()->create(['email' => 'owner@sulis.test']);
        $ids = [
            '{category}' => Category::factory()->create()->id,
            '{unit}' => Unit::factory()->create()->id,
            '{product}' => $this->product->id,
            '{project}' => $project->id,
            '{purchase}' => $purchase->id,
        ];

        $token = $this->callAsGudang('POST api/v1/auth/login', [], ['email' => 'gudang@sulis.test', 'password' => 'Password123'])->json('data.token');
        $ownerToken = $this->postJson('/api/v1/auth/login', ['email' => 'owner@sulis.test', 'password' => 'Password123'])->json('data.token');
        $as = function (string $route, array $body = []) use (&$ids, $token): TestResponse {
            return $this->callAsGudang($route, $ids, $body, $token);
        };

        $as('GET api/v1/auth/me');
        $as('GET api/v1/categories');
        $as('POST api/v1/categories', ['name' => 'Lampu']);
        $as('PUT api/v1/categories/{category}', ['name' => 'Kabel Listrik', 'is_active' => true]);
        $as('GET api/v1/units');
        $as('POST api/v1/units', ['name' => 'Roll', 'symbol' => 'roll']);
        $as('PUT api/v1/units/{unit}', ['name' => 'Meter', 'symbol' => 'mtr', 'is_active' => true]);
        $as('GET api/v1/products');
        $as('POST api/v1/products', ['sku' => 'PP-001', 'name' => 'Pipa PVC', 'category_id' => $ids['{category}'], 'unit_id' => $ids['{unit}']]);
        $as('GET api/v1/products/{product}');
        $as('PUT api/v1/products/{product}', ['sku' => 'KBL-001', 'name' => 'Kabel NYM', 'category_id' => $ids['{category}'], 'unit_id' => $ids['{unit}'], 'is_active' => true]);
        $as('GET api/v1/imports/products/template');
        $as('POST api/v1/imports/products', ['file' => $this->xlsxUpload([['sku', 'nama', 'kategori', 'satuan'], ['LMP-001', 'Lampu LED', 'Lampu', 'roll']])]);
        $as('GET api/v1/projects');
        $as('GET api/v1/projects/{project}');
        $as('POST api/v1/purchases/{purchase}/receive');
        $as('GET api/v1/purchases');
        $as('GET api/v1/purchases/{purchase}');
        $out = $as('POST api/v1/stock-outs', [
            'project_id' => $project->id, 'person_name' => 'Budi', 'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->product->id, 'qty' => '20']],
        ]);
        $as('POST api/v1/stock-returns', [
            'project_id' => $project->id, 'person_name' => 'Budi', 'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->product->id, 'qty' => '5']],
        ]);
        $ids['{stockTransaction}'] = $out->json('data.id');
        $as('GET api/v1/stock-transactions');
        $as('GET api/v1/stock-transactions/{stockTransaction}');
        $as('GET api/v1/projects/{project}/issued-items');

        // Opname: counted, submitted, posted by the Owner (so opname movements exist), then read by Gudang.
        $ids['{stockOpname}'] = $as('POST api/v1/stock-opnames', ['opname_date' => '2026-10-27'])->json('data.id');
        $as('PUT api/v1/stock-opnames/{stockOpname}/items', ['items' => [['product_id' => $this->product->id, 'counted_qty' => '98']]]);
        $as('POST api/v1/stock-opnames/{stockOpname}/submit');
        $this->app['auth']->forgetGuards();
        $this->withToken($ownerToken)->postJson("/api/v1/stock-opnames/{$ids['{stockOpname}']}/post")->assertOk();
        $as('GET api/v1/stock-opnames/{stockOpname}');
        $as('GET api/v1/stock-opnames');
        $ids['{stockOpname}'] = $as('POST api/v1/stock-opnames', ['opname_date' => '2026-10-27'])->json('data.id');
        $as('POST api/v1/stock-opnames/{stockOpname}/cancel');

        $as('GET api/v1/products/{product}/movements');
        $as('GET api/v1/reports/movements')->assertJsonFragment(['type' => 'opname_out']);
        $as('GET api/v1/reports/projects/{project}/materials');
        $as('GET api/v1/dashboard');
        $as('PUT api/v1/auth/password', ['current_password' => 'Password123', 'password' => 'BaruSekali9', 'password_confirmation' => 'BaruSekali9']);
        $as('POST api/v1/auth/logout');

        $called = array_unique($this->called);
        $listed = self::GUDANG_ROUTES;
        sort($called);
        sort($listed);
        $this->assertSame($listed, $called, 'Every route in GUDANG_ROUTES must be called in this test.');
    }

    /** Calls one route (key as in GUDANG_ROUTES) as Gudang and checks there is no money key in the answer. */
    private function callAsGudang(string $route, array $ids, array $body = [], ?string $token = null): TestResponse
    {
        [$method, $uri] = explode(' ', $route, 2);
        $url = '/'.strtr($uri, array_map('strval', $ids));
        $this->app['auth']->forgetGuards();
        $headers = $token ? ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'] : ['Accept' => 'application/json'];

        $response = isset($body['file'])
            ? $this->call($method, $url, [], [], $body, $this->transformHeadersToServerVars($headers))
            : $this->json($method, $url, $body, $headers);

        $this->called[] = $route;
        if (in_array($route, self::NO_JSON_BODY, true)) {
            $response->assertSuccessful();
        } else {
            $this->assertNoMoneyKeys($response);
        }

        return $response;
    }
}
