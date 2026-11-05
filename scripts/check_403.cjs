const path = require('path');
const { chromium } = require(path.resolve('./frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.request().method()} ${res.url()}`);
    }
  });

  const routes = ['/', '/app/new', '/app/queue', '/app/hub', '/app/audit', '/app/insights'];
  for (const r of routes) {
    console.log(`\nVisiting ${r}...`);
    await page.goto(`http://localhost:5173${r}`, { waitUntil: 'networkidle' });
  }

  await browser.close();
})();
