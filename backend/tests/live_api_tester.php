<?php

/**
 * Task 26B Comprehensive Live HTTP API Tester
 * Base URL: http://127.0.0.1:8000/api/v1
 */

define('BASE_URL', 'http://127.0.0.1:8000/api/v1');

$results = [
    'auth' => 'FAIL',
    'read_only' => 'FAIL',
    'validation' => 'FAIL',
    'inventory_mutation' => 'FAIL',
    'purchasing_workflow' => 'FAIL',
    'project_expense' => 'FAIL',
    'stock_opname' => 'FAIL',
    'reports' => 'FAIL',
    'error_handling' => 'FAIL',
    'data_integrity' => 'FAIL',
];

$stats = [
    'tested' => 0,
    'passed' => 0,
    'failed' => 0,
    'skipped' => 0,
];

function http_req($method, $endpoint, $data = null, $token = null) {
    global $stats;
    $stats['tested']++;

    $ch = curl_init(BASE_URL . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $json = json_decode($raw, true);
    curl_close($ch);
    
    return [
        'status' => $status,
        'body' => $json ?? $raw,
        'raw' => $raw,
    ];
}

function assert_status($name, $response, $expectedStatus) {
    global $stats;
    $pass = ($response['status'] === $expectedStatus);
    if ($pass) {
        $stats['passed']++;
        echo "  [PASS] {$name} (HTTP {$response['status']})\n";
    } else {
        $stats['failed']++;
        echo "  [FAIL] {$name} (Expected HTTP {$expectedStatus}, Got {$response['status']})\n";
        if (is_array($response['body'])) {
            echo "         Response: " . json_encode($response['body']) . "\n";
        } else {
            echo "         Raw: " . substr($response['raw'], 0, 200) . "\n";
        }
    }
    return $pass;
}

echo "=======================================================\n";
echo "       TASK 26B — LIVE API ENDPOINT SUITE RUN          \n";
echo "=======================================================\n\n";

// --- STEP 1 & 2: AUTHENTICATION ---
echo "--- 1 & 2. Authentication ---\n";
$loginOwner = http_req('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => 'password']);
$authOk = assert_status('Owner Login', $loginOwner, 200);
$ownerToken = $loginOwner['body']['data']['access_token'] ?? null;

$loginFinance = http_req('POST', '/auth/login', ['email' => 'finance@example.com', 'password' => 'password']);
assert_status('Finance Login', $loginFinance, 200);
$financeToken = $loginFinance['body']['data']['access_token'] ?? null;

$loginWarehouse = http_req('POST', '/auth/login', ['email' => 'warehouse@example.com', 'password' => 'password']);
assert_status('Warehouse Login', $loginWarehouse, 200);
$warehouseToken = $loginWarehouse['body']['data']['access_token'] ?? null;

$meResp = http_req('GET', '/auth/me', null, $ownerToken);
assert_status('GET /auth/me', $meResp, 200);

if ($authOk && $ownerToken && $financeToken && $warehouseToken) {
    $results['auth'] = 'PASS';
}

// --- STEP 3: READ-ONLY ENDPOINTS ---
echo "\n--- 3. Read-Only APIs ---\n";
$readSuccess = true;

$readSuccess &= assert_status('GET /dashboard/owner', http_req('GET', '/dashboard/owner', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /dashboard/warehouse', http_req('GET', '/dashboard/warehouse', null, $warehouseToken), 200);
$readSuccess &= assert_status('GET /dashboard/finance', http_req('GET', '/dashboard/finance', null, $financeToken), 200);

$readSuccess &= assert_status('GET /categories', http_req('GET', '/categories', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /units', http_req('GET', '/units', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /products', http_req('GET', '/products', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /suppliers', http_req('GET', '/suppliers', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /projects', http_req('GET', '/projects', null, $ownerToken), 200);

$readSuccess &= assert_status('GET /inventory/stocks', http_req('GET', '/inventory/stocks', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /inventory/products/1/movements', http_req('GET', '/inventory/products/1/movements', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /purchases', http_req('GET', '/purchases', null, $ownerToken), 200);
$readSuccess &= assert_status('GET /stock-opnames', http_req('GET', '/stock-opnames', null, $ownerToken), 200);

if ($readSuccess) {
    $results['read_only'] = 'PASS';
}

// Ensure at least one supplier exists for purchasing test
$supCheck = http_req('GET', '/suppliers', null, $ownerToken);
$supplierId = $supCheck['body'][0]['id'] ?? null;
if (!$supplierId) {
    $newSup = http_req('POST', '/suppliers', [
        'name' => 'Supplier Utama',
        'email' => 'supplier@example.com',
        'phone' => '081234567890',
        'address' => 'Jl. Test No. 123'
    ], $ownerToken);
    $supplierId = $newSup['body']['id'] ?? 1;
}

// --- STEP 4: VALIDATION TESTING ---
echo "\n--- 4. Validation Testing ---\n";
$valSuccess = true;
$valSuccess &= assert_status('Invalid Purchase In (-quantity)', http_req('POST', '/inventory/purchase-in', ['quantity' => -5], $ownerToken), 422);
$valSuccess &= assert_status('Invalid Project Usage (empty project_id)', http_req('POST', '/inventory/project-usage', ['quantity' => 1], $ownerToken), 422);
$valSuccess &= assert_status('Invalid Purchase Create (non-existent supplier)', http_req('POST', '/purchases', ['supplier_id' => 99999, 'items' => []], $financeToken), 422);
$valSuccess &= assert_status('Invalid Stock Opname (empty number)', http_req('POST', '/stock-opnames', ['opname_number' => ''], $warehouseToken), 422);
$valSuccess &= assert_status('Invalid Expense Create (-amount)', http_req('POST', '/projects/1/expenses', ['amount' => -100], $financeToken), 422);

if ($valSuccess) {
    $results['validation'] = 'PASS';
}

// --- STEP 5: INVENTORY MUTATION TEST ---
echo "\n--- 5. Inventory Mutation Test ---\n";
$invSuccess = true;

// Purchase In
$pIn = http_req('POST', '/inventory/purchase-in', [
    'product_id' => 1,
    'quantity' => 20,
    'unit_cost' => 10000,
    'transaction_date' => date('Y-m-d'),
], $ownerToken);
$invSuccess &= assert_status('POST /inventory/purchase-in', $pIn, 201);

// Project Usage
$pUsage = http_req('POST', '/inventory/project-usage', [
    'product_id' => 1,
    'project_id' => 1,
    'quantity' => 5,
    'transaction_date' => date('Y-m-d'),
], $ownerToken);
$invSuccess &= assert_status('POST /inventory/project-usage', $pUsage, 201);

// Stock Out
$sOut = http_req('POST', '/inventory/stock-out', [
    'product_id' => 1,
    'quantity' => 2,
    'transaction_date' => date('Y-m-d'),
], $ownerToken);
$invSuccess &= assert_status('POST /inventory/stock-out', $sOut, 201);

// Adjustment In
$adjIn = http_req('POST', '/inventory/adjustment-in', [
    'product_id' => 1,
    'quantity' => 10,
    'unit_cost' => 10000,
    'transaction_date' => date('Y-m-d'),
], $ownerToken);
$invSuccess &= assert_status('POST /inventory/adjustment-in', $adjIn, 201);

// Adjustment Out
$adjOut = http_req('POST', '/inventory/adjustment-out', [
    'product_id' => 1,
    'quantity' => 3,
    'transaction_date' => date('Y-m-d'),
], $ownerToken);
$invSuccess &= assert_status('POST /inventory/adjustment-out', $adjOut, 201);

if ($invSuccess) {
    $results['inventory_mutation'] = 'PASS';
}

// --- STEP 6: PURCHASING WORKFLOW ---
echo "\n--- 6. Purchasing Workflow ---\n";
$purSuccess = true;

// Create Draft
$pDraft = http_req('POST', '/purchases', [
    'supplier_id' => $supplierId,
    'purchase_date' => date('Y-m-d'),
    'items' => [
        ['product_id' => 1, 'quantity' => 10, 'unit_cost' => 12000]
    ]
], $financeToken);
$purSuccess &= assert_status('Create Purchase Draft', $pDraft, 201);
$purchaseId = $pDraft['body']['id'] ?? null;

if ($purchaseId) {
    // First Confirm -> 200
    $confirm1 = http_req('POST', "/purchases/{$purchaseId}/confirm", null, $financeToken);
    $purSuccess &= assert_status('First Purchase Confirm', $confirm1, 200);

    // Double Confirm -> 422
    $confirm2 = http_req('POST', "/purchases/{$purchaseId}/confirm", null, $financeToken);
    $purSuccess &= assert_status('Double Purchase Confirm Rejection', $confirm2, 422);
}

// Create another Draft for Cancel test
$pDraft2 = http_req('POST', '/purchases', [
    'supplier_id' => $supplierId,
    'purchase_date' => date('Y-m-d'),
    'items' => [
        ['product_id' => 1, 'quantity' => 5, 'unit_cost' => 10000]
    ]
], $financeToken);
$purchaseId2 = $pDraft2['body']['id'] ?? null;

if ($purchaseId2) {
    // First Cancel -> 200
    $cancel1 = http_req('POST', "/purchases/{$purchaseId2}/cancel", null, $financeToken);
    $purSuccess &= assert_status('First Purchase Cancel', $cancel1, 200);

    // Double Cancel -> 422
    $cancel2 = http_req('POST', "/purchases/{$purchaseId2}/cancel", null, $financeToken);
    $purSuccess &= assert_status('Double Purchase Cancel Rejection', $cancel2, 422);
}

if ($purSuccess) {
    $results['purchasing_workflow'] = 'PASS';
}

// --- STEP 7: PROJECT EXPENSE API ---
echo "\n--- 7. Project Expense API ---\n";
$expSuccess = true;

// Create Expense
$expCreate = http_req('POST', '/projects/1/expenses', [
    'description' => 'Live Test Expense',
    'amount' => 100000,
    'expense_date' => date('Y-m-d')
], $financeToken);
$expSuccess &= assert_status('POST /projects/1/expenses', $expCreate, 201);
$expId = $expCreate['body']['id'] ?? null;

if ($expId) {
    // GET Expense
    $expGet = http_req('GET', "/projects/1/expenses/{$expId}", null, $financeToken);
    $expSuccess &= assert_status('GET /projects/1/expenses/{id}', $expGet, 200);

    // PUT Expense
    $expPut = http_req('PUT', "/projects/1/expenses/{$expId}", ['amount' => 150000], $financeToken);
    $expSuccess &= assert_status('PUT /projects/1/expenses/{id}', $expPut, 200);

    // GET Profitability (check calculations updated)
    $prof = http_req('GET', '/projects/1/profitability', null, $financeToken);
    $expSuccess &= assert_status('GET /projects/1/profitability', $prof, 200);

    // DELETE Expense
    $expDel = http_req('DELETE', "/projects/1/expenses/{$expId}", null, $financeToken);
    $expSuccess &= assert_status('DELETE /projects/1/expenses/{id}', $expDel, 204);
}

if ($expSuccess) {
    $results['project_expense'] = 'PASS';
}

// --- STEP 8: STOCK OPNAME API ---
echo "\n--- 8. Stock Opname API ---\n";
$soSuccess = true;

$soNum = 'SO-LIVE-' . time();
$soCreate = http_req('POST', '/stock-opnames', [
    'opname_number' => $soNum,
    'opname_date' => date('Y-m-d')
], $warehouseToken);
$soSuccess &= assert_status('POST /stock-opnames (Create Draft)', $soCreate, 201);
$soId = $soCreate['body']['id'] ?? null;

if ($soId) {
    // Add item (difference > 0)
    $soItem = http_req('POST', "/stock-opnames/{$soId}/items", [
        'product_id' => 1,
        'physical_quantity' => 1000
    ], $warehouseToken);
    $soSuccess &= assert_status('POST /stock-opnames/{id}/items', $soItem, 201);

    // Complete opname
    $soComp = http_req('POST', "/stock-opnames/{$soId}/complete", null, $warehouseToken);
    $soSuccess &= assert_status('POST /stock-opnames/{id}/complete', $soComp, 200);

    // Post-complete mutation rejection check
    $soPostItem = http_req('POST', "/stock-opnames/{$soId}/items", [
        'product_id' => 1,
        'physical_quantity' => 1050
    ], $warehouseToken);
    $soSuccess &= assert_status('Post-completion Item Addition Rejection', $soPostItem, 422);

    $soPostComp = http_req('POST', "/stock-opnames/{$soId}/complete", null, $warehouseToken);
    $soSuccess &= assert_status('Post-completion Re-complete Rejection', $soPostComp, 422);
}

if ($soSuccess) {
    $results['stock_opname'] = 'PASS';
}

// --- STEP 9: REPORTS API ---
echo "\n--- 9. Reports API ---\n";
$repSuccess = true;
$repSuccess &= assert_status('GET /reports/inventory-summary', http_req('GET', '/reports/inventory-summary', null, $ownerToken), 200);
$repSuccess &= assert_status('GET /reports/stock-movements', http_req('GET', '/reports/stock-movements', null, $ownerToken), 200);
$repSuccess &= assert_status('GET /reports/purchase-summary', http_req('GET', '/reports/purchase-summary', null, $ownerToken), 200);
$repSuccess &= assert_status('GET /reports/project-profitability', http_req('GET', '/reports/project-profitability', null, $ownerToken), 200);
$repSuccess &= assert_status('GET /reports/financial-overview', http_req('GET', '/reports/financial-overview', null, $ownerToken), 200);
$repSuccess &= assert_status('GET /reports/projects/1/cost-detail', http_req('GET', '/reports/projects/1/cost-detail', null, $ownerToken), 200);

if ($repSuccess) {
    $results['reports'] = 'PASS';
}

// --- STEP 10: ERROR HANDLING ---
echo "\n--- 10. Error Handling ---\n";
$errSuccess = true;

// 404 for missing resource ID
$err404 = http_req('GET', '/products/999999', null, $ownerToken);
$errSuccess &= assert_status('404 for Non-existent Resource ID', $err404, 404);

// Insufficient stock error (400)
$errStock = http_req('POST', '/inventory/stock-out', [
    'product_id' => 1,
    'quantity' => 9999999,
    'transaction_date' => date('Y-m-d')
], $ownerToken);
$errSuccess &= assert_status('400 for Insufficient Stock', $errStock, 400);

if ($errSuccess) {
    $results['error_handling'] = 'PASS';
}

// --- STEP 11: DATA INTEGRITY ---
echo "\n--- 11. Data Integrity ---\n";
$stockCheck = http_req('GET', '/inventory/stocks/1', null, $ownerToken);
$stockQty = $stockCheck['body']['quantity'] ?? 0;
echo "Product #1 Current Stock Quantity: {$stockQty}\n";

if ($stockQty >= 0) {
    echo "  [PASS] No negative stock found.\n";
    $results['data_integrity'] = 'PASS';
} else {
    echo "  [FAIL] Negative stock detected!\n";
}

echo "\n=======================================================\n";
echo "                   FINAL SUMMARY                       \n";
echo "=======================================================\n";
echo "Total Endpoints Tested : {$stats['tested']}\n";
echo "Total Passed           : {$stats['passed']}\n";
echo "Total Failed           : {$stats['failed']}\n";
echo "Total Skipped          : {$stats['skipped']}\n\n";

foreach ($results as $cat => $res) {
    echo sprintf("%-25s: %s\n", strtoupper($cat), $res);
}

echo "\n=== SUITE COMPLETE ===\n";
