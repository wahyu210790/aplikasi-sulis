const puppeteer = require('puppeteer');

(async () => {
  console.log("=======================================================");
  console.log("   TASK 38 — MOBILE-FIRST RESPONSIVE TEST SUITE       ");
  console.log("=======================================================\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const viewports = [320, 360, 375, 390, 414, 430];
  const consoleErrors = [];
  const networkErrors = [];

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
    await page.goto('http://127.0.0.1:8080/#/login', { waitUntil: 'networkidle0' });
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

  // --- LOGIN PAGE RESPONSIVENESS TEST ---
  console.log("--- Testing Login Page Across Viewports ---");
  for (const width of viewports) {
    await page.setViewport({ width, height: 800 });
    await page.goto('http://127.0.0.1:8080/#/login', { waitUntil: 'networkidle0' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Viewport ${width}px | Body Horizontal Overflow: ${overflow ? 'YES (FAIL)' : 'NO (PASS)'}`);
  }

  // --- AUTHENTICATED APP RESPONSIVENESS TEST ---
  console.log("\n--- Logging in as Owner ---");
  await page.setViewport({ width: 375, height: 812 });
  await login('owner@example.com', 'password');
  console.log("Logged in successfully.");

  const routes = [
    '#/dashboard',
    '#/master-data',
    '#/inventory',
    '#/purchasing',
    '#/projects',
    '#/stock-opname',
    '#/reports'
  ];

  console.log("\n--- Testing Routes Across Viewports (320px - 430px) ---");
  for (const width of viewports) {
    await page.setViewport({ width, height: 800 });
    console.log(`\n> Viewport Width: ${width}px`);
    for (const route of routes) {
      await page.goto(`http://127.0.0.1:8080/${route}`, { waitUntil: 'networkidle0' });
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      const title = await page.evaluate(() => document.getElementById('topbarBreadcrumb')?.innerText || '');
      console.log(`  Route ${route} [${title}] | Overflow: ${overflow ? 'YES (FAIL)' : 'NO (PASS)'}`);
    }
  }

  // --- MOBILE DRAWER INTERACTION TEST ---
  console.log("\n--- Testing Mobile Drawer Interaction ---");
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:8080/#/dashboard', { waitUntil: 'networkidle0' });
  
  // Click Mobile Hamburger Button
  await page.click('#mobileMenuBtn');
  await new Promise(r => setTimeout(r, 400));
  const isDrawerVisible = await page.evaluate(() => {
    const sidebar = document.getElementById('appSidebar');
    return sidebar && !sidebar.classList.contains('-translate-x-full');
  });
  console.log(`Mobile Hamburger Click -> Drawer Opened: ${isDrawerVisible ? 'YES (PASS)' : 'NO (FAIL)'}`);

  // Click Close Drawer Button
  await page.click('#closeDrawerBtn');
  await new Promise(r => setTimeout(r, 400));
  const isDrawerClosed = await page.evaluate(() => {
    const sidebar = document.getElementById('appSidebar');
    return sidebar && sidebar.classList.contains('-translate-x-full');
  });
  console.log(`Close Button Click -> Drawer Closed: ${isDrawerClosed ? 'YES (PASS)' : 'NO (FAIL)'}`);

  // Re-open and test Backdrop Click outside sidebar (x: 320, y: 400)
  await page.click('#mobileMenuBtn');
  await new Promise(r => setTimeout(r, 400));
  await page.mouse.click(340, 400);
  await new Promise(r => setTimeout(r, 400));
  const isBackdropClosed = await page.evaluate(() => {
    const sidebar = document.getElementById('appSidebar');
    return sidebar && sidebar.classList.contains('-translate-x-full');
  });
  console.log(`Backdrop Click -> Drawer Closed: ${isBackdropClosed ? 'YES (PASS)' : 'NO (FAIL)'}`);

  // --- SUMMARY ---
  console.log("\n=======================================================");
  console.log("                   SUMMARY TEST                        ");
  console.log("=======================================================");
  console.log(`Console Errors : ${consoleErrors.length}`);
  console.log(`Network Errors : ${networkErrors.length}`);

  await browser.close();
  console.log("\n=== MOBILE SUITE COMPLETE ===");
})();
