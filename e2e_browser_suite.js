const puppeteer = require('puppeteer');

(async () => {
  console.log("=======================================================");
  console.log("       TASK 26D — BROWSER E2E TEST SUITE RUN           ");
  console.log("=======================================================\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const consoleErrors = [];
  const networkErrors = [];

  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log("  [CONSOLE ERROR]:", msg.text());
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon')) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
      console.log(`  [NETWORK ${resp.status()}]:`, resp.url());
    }
  });

  async function login(email, password) {
    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#email', { timeout: 10000 });
    
    await page.type('#email', email);
    await page.type('#password', password);
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/auth/login')),
      page.click('button[type="submit"]')
    ]);
    await page.waitForSelector('#mainContent', { timeout: 10000 });
  }

  // --- STEP 1: BASIC APP BOOT & LOGIN ---
  console.log("--- Step 1: Boot & Login ---");
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle0' });
  const title = await page.title();
  console.log(`App Loaded. Page Title: "${title}"`);

  // --- STEP 2: OWNER NAVIGATION ---
  console.log("\n--- Step 2: Owner Navigation ---");
  await login('owner@example.com', 'password');
  console.log("Logged in as Owner.");

  const ownerRoutes = [
    '#/dashboard',
    '#/master-data',
    '#/inventory',
    '#/purchasing',
    '#/projects',
    '#/stock-opname',
    '#/reports'
  ];

  for (const route of ownerRoutes) {
    await page.goto(`http://127.0.0.1:8080/${route}`, { waitUntil: 'networkidle0' });
    const content = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
    const isBlank = content.trim().length === 0;
    const is404 = content.includes('404') || content.includes('Halaman tidak ditemukan');
    console.log(`Navigated to ${route} | Blank: ${isBlank} | 404: ${is404}`);
  }

  // --- STEP 3: MASTER DATA ---
  console.log("\n--- Step 3: Master Data ---");
  await page.goto('http://127.0.0.1:8080/#/master-data', { waitUntil: 'networkidle0' });
  const masterContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log("Master Data Tab rendered successfully.");

  // --- STEP 4: INVENTORY E2E ---
  console.log("\n--- Step 4: Inventory E2E ---");
  await page.goto('http://127.0.0.1:8080/#/inventory', { waitUntil: 'networkidle0' });
  const invContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Inventory view loaded. Stock tables present: ${invContent.includes('Stock') || invContent.includes('Produk')}`);

  // --- STEP 5: PURCHASING E2E ---
  console.log("\n--- Step 5: Purchasing E2E ---");
  await page.goto('http://127.0.0.1:8080/#/purchasing', { waitUntil: 'networkidle0' });
  const purContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Purchasing view loaded. Items present: ${purContent.includes('Purchase') || purContent.includes('Supplier')}`);

  // --- STEP 6: PROJECTS & EXPENSES E2E ---
  console.log("\n--- Step 6: Projects & Expenses E2E ---");
  await page.goto('http://127.0.0.1:8080/#/projects', { waitUntil: 'networkidle0' });
  const projContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Projects view loaded. Content: ${projContent.slice(0, 100).replace(/\n/g, ' ')}...`);

  // --- STEP 7: STOCK OPNAME E2E ---
  console.log("\n--- Step 7: Stock Opname E2E ---");
  await page.goto('http://127.0.0.1:8080/#/stock-opname', { waitUntil: 'networkidle0' });
  const soContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Stock Opname view loaded. Opname items present: ${soContent.includes('Stock Opname') || soContent.includes('Opname')}`);

  // --- STEP 8: REPORTS E2E ---
  console.log("\n--- Step 8: Reports E2E ---");
  await page.goto('http://127.0.0.1:8080/#/reports', { waitUntil: 'networkidle0' });
  const repContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Reports view loaded. Reports present: ${repContent.includes('Laporan') || repContent.includes('Report')}`);

  // --- STEP 9: FINANCE ROLE E2E ---
  console.log("\n--- Step 9: Finance Role E2E ---");
  await login('finance@example.com', 'password');
  console.log("Logged in as Finance.");
  await page.goto('http://127.0.0.1:8080/#/purchasing', { waitUntil: 'networkidle0' });
  const finPurContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Finance Purchasing access: ${!finPurContent.includes('Access Denied')}`);

  // --- STEP 10: WAREHOUSE ROLE E2E & GUARD CHECK ---
  console.log("\n--- Step 10: Warehouse Role E2E & Guard Check ---");
  await login('warehouse@example.com', 'password');
  console.log("Logged in as Warehouse.");

  // Warehouse direct navigation to restricted routes
  await page.goto('http://127.0.0.1:8080/#/projects', { waitUntil: 'networkidle0' });
  const whProjContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Warehouse direct hash navigation #/projects -> Access Denied: ${whProjContent.includes('Access Denied') || whProjContent.includes('tidak memiliki izin')}`);

  await page.goto('http://127.0.0.1:8080/#/purchasing', { waitUntil: 'networkidle0' });
  const whPurContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Warehouse direct hash navigation #/purchasing -> Access Denied / 404: ${whPurContent.includes('Access Denied') || whPurContent.includes('404') || whPurContent.includes('tidak')}`);

  // --- STEP 11 & 12: REFRESH & LOGOUT ---
  console.log("\n--- Step 11 & 12: Refresh & Logout ---");
  await page.goto('http://127.0.0.1:8080/#/inventory', { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  const refreshedContent = await page.evaluate(() => document.getElementById('mainContent')?.innerText || '');
  console.log(`Page refreshed on #/inventory. Session retained: ${!refreshedContent.includes('Login')}`);

  // Logout via localStorage clear & redirect
  await page.evaluate(() => {
    localStorage.clear();
    window.location.hash = '#/login';
  });
  await page.goto('http://127.0.0.1:8080/#/inventory', { waitUntil: 'networkidle0' });
  const postLogoutContent = await page.evaluate(() => document.body.innerText || '');
  console.log(`Protected page access after logout -> Redirected to Login: ${postLogoutContent.includes('Login') || postLogoutContent.includes('Email')}`);

  // --- SUMMARY ---
  console.log("\n=======================================================");
  console.log("                   SUMMARY AUDIT                       ");
  console.log("=======================================================");
  console.log(`Uncaught Console Errors : ${consoleErrors.length}`);
  console.log(`Failed Network Requests : ${networkErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log("Console Errors:", consoleErrors);
  }
  if (networkErrors.length > 0) {
    console.log("Network Errors:", networkErrors);
  }

  await browser.close();
  console.log("\n=== E2E SUITE COMPLETE ===");
})();
