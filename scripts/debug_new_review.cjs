const path = require('path');
const { chromium } = require(path.resolve('./frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err}`));
  page.on('response', res => {
    if (res.status() >= 400) console.log(`[HTTP ${res.status()}] ${res.request().method()} ${res.url()}`);
  });

  await page.goto('http://localhost:5173/app/new', { waitUntil: 'networkidle' });

  // Click Sample 1
  console.log('Clicking sample 1...');
  await page.locator('button:has-text("Sample 1")').click();

  // Inspect form values
  const formValues = await page.evaluate(() => {
    const selKit = document.querySelector('select[aria-label="Brand kit"]');
    const selFormat = document.querySelector('select[aria-label="Content format"]');
    const ta = document.querySelector('textarea');
    return {
      selectedKit: selKit ? selKit.value : null,
      contentType: selFormat ? selFormat.value : null,
      content: ta ? ta.value.slice(0, 40) : null,
    };
  });
  console.log('Form values after sample:', formValues);

  console.log('Clicking Run Review...');
  await page.locator('button:has-text("Run Review")').click();

  await page.waitForTimeout(3000);
  console.log('URL after clicking Run Review:', page.url());

  const formError = await page.locator('.text-danger').textContent().catch(() => null);
  if (formError) console.log('Form error shown:', formError);

  await browser.close();
})();
