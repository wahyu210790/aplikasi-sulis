<?php

/**
 * Task 26C — Live Security & Role Authorization Tester
 * Base URL: http://127.0.0.1:8000/api/v1
 */

define('BASE_URL', 'http://127.0.0.1:8000/api/v1');

function http_req($method, $endpoint, $data = null, $token = null) {
    $ch = curl_init(BASE_URL . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    if ($token !== null) {
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

echo "=======================================================\n";
echo "       TASK 26C — LIVE SECURITY & ROLE SUITE           \n";
echo "=======================================================\n\n";

// 1. Authentication
echo "--- 1. Login & Token Retrieval ---\n";
$ownerLogin = http_req('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => 'password']);
$financeLogin = http_req('POST', '/auth/login', ['email' => 'finance@example.com', 'password' => 'password']);
$warehouseLogin = http_req('POST', '/auth/login', ['email' => 'warehouse@example.com', 'password' => 'password']);

$ownerToken = $ownerLogin['body']['data']['access_token'] ?? null;
$financeToken = $financeLogin['body']['data']['access_token'] ?? null;
$warehouseToken = $warehouseLogin['body']['data']['access_token'] ?? null;

echo "Owner Login: HTTP {$ownerLogin['status']}\n";
echo "Finance Login: HTTP {$financeLogin['status']}\n";
echo "Warehouse Login: HTTP {$warehouseLogin['status']}\n";

// 2. Authentication Bypass Checks (Unauthenticated & Invalid Token)
echo "\n--- 2. Unauthenticated & Invalid Token Access (Expected HTTP 401) ---\n";
$unauthDash = http_req('GET', '/dashboard/owner', null, null);
echo "Unauthenticated GET /dashboard/owner: HTTP {$unauthDash['status']} (Expected 401)\n";

$invalidDash = http_req('GET', '/dashboard/owner', null, 'invalid_token_xyz_123');
echo "Invalid Token GET /dashboard/owner: HTTP {$invalidDash['status']} (Expected 401)\n";

// 3. Role Authorization Matrix Testing
echo "\n--- 3. Role Authorization Matrix Testing ---\n";

$matrix = [
    // Endpoint, Method, PayloadGenerator, OwnerExpected, FinanceExpected, WarehouseExpected
    ['/dashboard/owner', 'GET', null, 200, 403, 403],
    ['/dashboard/warehouse', 'GET', null, 403, 403, 200],
    ['/dashboard/finance', 'GET', null, 403, 200, 403],
    
    // Master Data
    ['/categories', 'GET', null, 200, 200, 200],
    ['/products', 'GET', null, 200, 200, 200],
    ['/suppliers', 'GET', null, 200, 200, 200],
    ['/projects', 'GET', null, 200, 200, 403],
    
    // Inventory Transactions
    ['/inventory/stocks', 'GET', null, 200, 200, 200],
    ['/inventory/purchase-in', 'POST', function() { return ['product_id' => 1, 'quantity' => 1, 'unit_cost' => 1000, 'transaction_date' => date('Y-m-d')]; }, 201, 403, 201],
    ['/inventory/project-usage', 'POST', function() { return ['product_id' => 1, 'project_id' => 1, 'quantity' => 1, 'transaction_date' => date('Y-m-d')]; }, 201, 403, 201],
    ['/inventory/stock-out', 'POST', function() { return ['product_id' => 1, 'quantity' => 1, 'transaction_date' => date('Y-m-d')]; }, 201, 403, 201],
    
    // Purchasing
    ['/purchases', 'GET', null, 200, 200, 403],
    ['/purchases', 'POST', function() { return ['supplier_id' => 1, 'purchase_date' => date('Y-m-d'), 'items' => [['product_id' => 1, 'quantity' => 1, 'unit_cost' => 1000]]]; }, 201, 201, 403],
    
    // Projects Profitability & Expenses
    ['/projects/1/profitability', 'GET', null, 200, 200, 403],
    ['/projects/1/expenses', 'GET', null, 200, 200, 403],
    ['/projects/1/expenses', 'POST', function() { return ['description' => 'Test', 'amount' => 500, 'expense_date' => date('Y-m-d')]; }, 201, 201, 403],
    
    // Stock Opname
    ['/stock-opnames', 'GET', null, 200, 403, 200],
    ['/stock-opnames', 'POST', function() { return ['opname_number' => 'SO-SEC-' . uniqid(), 'opname_date' => date('Y-m-d')]; }, 201, 403, 201],
    
    // Reports
    ['/reports/inventory-summary', 'GET', null, 200, 403, 200],
    ['/reports/purchase-summary', 'GET', null, 200, 200, 403],
    ['/reports/project-profitability', 'GET', null, 200, 200, 403],
    ['/reports/financial-overview', 'GET', null, 200, 200, 403],
];

printf("%-35s %-6s | %-7s | %-7s | %-7s\n", "ENDPOINT", "METHOD", "OWNER", "FINANCE", "WAREHOUSE");
echo "----------------------------------------------------------------------\n";

$matrixPassed = 0;
$matrixFailed = 0;

foreach ($matrix as $row) {
    list($ep, $method, $payloadGen, $ownerExp, $financeExp, $warehouseExp) = $row;
    
    // Test Owner
    $pOwner = is_callable($payloadGen) ? $payloadGen() : $payloadGen;
    $rOwner = http_req($method, $ep, $pOwner, $ownerToken);
    $stOwner = $rOwner['status'];
    
    // Test Finance
    $pFinance = is_callable($payloadGen) ? $payloadGen() : $payloadGen;
    $rFinance = http_req($method, $ep, $pFinance, $financeToken);
    $stFinance = $rFinance['status'];
    
    // Test Warehouse
    $pWarehouse = is_callable($payloadGen) ? $payloadGen() : $payloadGen;
    $rWarehouse = http_req($method, $ep, $pWarehouse, $warehouseToken);
    $stWarehouse = $rWarehouse['status'];
    
    $ownerOk = ($stOwner === $ownerExp);
    $financeOk = ($stFinance === $financeExp);
    $warehouseOk = ($stWarehouse === $warehouseExp);
    
    $rowOk = $ownerOk && $financeOk && $warehouseOk;
    if ($rowOk) {
        $matrixPassed++;
    } else {
        $matrixFailed++;
    }
    
    printf(
        "%-35s %-6s | %d (%s) | %d (%s) | %d (%s)\n",
        $ep,
        $method,
        $stOwner, $ownerOk ? 'OK' : 'ERR',
        $stFinance, $financeOk ? 'OK' : 'ERR',
        $stWarehouse, $warehouseOk ? 'OK' : 'ERR'
    );
}

// 4. Role Escalation Test
echo "\n--- 4. Role Escalation Test ---\n";
$escalateResp = http_req('POST', '/inventory/purchase-in', [
    'product_id' => 1,
    'quantity' => 1,
    'unit_cost' => 1000,
    'transaction_date' => date('Y-m-d'),
    'role' => 'owner',
    'created_by' => 1
], $warehouseToken);

echo "Warehouse Purchase In with 'role: owner' payload: HTTP {$escalateResp['status']}\n";

// 5. HTTP Method Abuse Test
echo "\n--- 5. HTTP Method Abuse Test ---\n";
$methodAbuse = http_req('GET', '/inventory/purchase-in', null, $ownerToken);
echo "GET /inventory/purchase-in (POST-only route): HTTP {$methodAbuse['status']} (Expected 405)\n";

$methodAbuse2 = http_req('POST', '/reports/inventory-summary', ['test' => 1], $ownerToken);
echo "POST /reports/inventory-summary (GET-only route): HTTP {$methodAbuse2['status']} (Expected 405)\n";

// 6. Security of Error Responses
echo "\n--- 6. Security of Error Responses ---\n";
$errorCheck = http_req('GET', '/products/non_existent_string_id', null, $ownerToken);
echo "GET /products/invalid_id Status: {$errorCheck['status']}\n";
if (is_string($errorCheck['body']) && (str_contains($errorCheck['body'], 'SQLSTATE') || str_contains($errorCheck['body'], 'Stack trace'))) {
    echo "  [FAIL] Sensitive DB/stack trace details leaked!\n";
} else {
    echo "  [PASS] Error response cleanly formatted without sensitive leakage.\n";
}

echo "\n=======================================================\n";
echo "              ROLE & SECURITY SUITE COMPLETE           \n";
echo "=======================================================\n";
echo "Matrix Passed : {$matrixPassed}\n";
echo "Matrix Failed : {$matrixFailed}\n";
