const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const networkResponses = [];
  page.on('console', msg => consoleMessages.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/v1/inventory/') || url.includes('/api/v1/products') || url.includes('/api/v1/projects') || url.includes('/api/v1/suppliers')) {
      const status = response.status();
      let body = null;
      try { body = await response.json(); } catch (e) {}
      networkResponses.push({url, status, body});
    }
  });
  await page.setViewport({width: 1280, height: 800});
  await page.goto('http://127.0.0.1:8080', {waitUntil: 'networkidle2'});
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', 'owner@example.com');
  await page.type('input[name="password"]', 'password');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({waitUntil: 'networkidle2'}),
  ]);
  await page.goto('http://127.0.0.1:8080#/inventory', {waitUntil: 'networkidle2'});
  await page.waitForTimeout(3000);
  const mainContent = await page.$eval('#mainContent', el => el.innerText).catch(() => null);
  console.log('===ACTUAL BROWSER ERROR===');
  console.log(pageErrors.length ? pageErrors.join('\n') : 'No page errors captured.');
  console.log('===CONSOLE MESSAGES===');
  consoleMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));
  console.log('===NETWORK RESPONSES===');
  networkResponses.forEach(r => {
    console.log(`URL: ${r.url}`);
    console.log(`Status: ${r.status}`);
    console.log(`Body: ${JSON.stringify(r.body, null, 2)}`);
    console.log('---');
  });
  console.log('===MAIN CONTENT===');
  console.log(mainContent || 'No #mainContent');
  await browser.close();
})();
