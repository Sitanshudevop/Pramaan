const path = require('path');
const { chromium } = require(path.resolve('./frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Test 1: Desktop width 1280
  console.log('--- Testing at 1280px width ---');
  let page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Check elementFromPoint over sidebar link
  const sidebarBox = await page.locator('aside a[href="/app/queue"]').boundingBox();
  console.log('1280px sidebar Queue box:', sidebarBox);
  if (sidebarBox) {
    const elAtPoint = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el ? { tag: el.tagName, class: el.className, text: el.textContent?.trim() } : null;
    }, { x: sidebarBox.x + 10, y: sidebarBox.y + 10 });
    console.log('1280px Element over sidebar Queue link:', elAtPoint);
  }

  await page.close();

  // Test 2: Tablet/medium width 900px (< lg 1024px)
  console.log('--- Testing at 900px width ---');
  page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const asideVis = await page.locator('aside').isVisible();
  console.log('900px aside visible?', asideVis);

  const menuBtn = page.locator('button[aria-label="Toggle navigation drawer"]');
  console.log('900px Menu button visible?', await menuBtn.isVisible());
  if (await menuBtn.isVisible()) {
    const menuBox = await menuBtn.boundingBox();
    const elOverMenu = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el ? { tag: el.tagName, class: el.className } : null;
    }, { x: menuBox.x + 5, y: menuBox.y + 5 });
    console.log('900px Element over Menu button:', elOverMenu);

    await menuBtn.click();
    console.log('Clicked menu button. Aside visible now?', await page.locator('aside').isVisible());

    // Check if backdrop covers clicks
    const backdrop = page.locator('.fixed.inset-0.z-40');
    console.log('Backdrop visible?', await backdrop.isVisible());

    // Try clicking sidebar link now
    const queueLink = page.locator('aside a[href="/app/queue"]');
    const qBox = await queueLink.boundingBox();
    console.log('Queue link box in open drawer:', qBox);
    if (qBox) {
      const elOverQ = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, class: el.className, text: el.textContent?.trim() } : null;
      }, { x: qBox.x + 20, y: qBox.y + 10 });
      console.log('Element over Queue link in drawer:', elOverQ);
    }
  }

  await page.close();

  // Test 3: Test ALL pages for console errors, missing handlers, dead buttons
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.toString()));

  const routes = ['/', '/app/new', '/app/queue', '/app/hub', '/app/audit', '/app/insights'];
  for (const r of routes) {
    await page.goto(`http://localhost:5173${r}`, { waitUntil: 'networkidle' });
    console.log(`Route ${r} H1:`, await page.locator('h1').first().textContent().catch(() => 'no h1'));
  }
  console.log('Total console errors across all product routes:', errors.length);
  if (errors.length > 0) console.log('Errors:', errors);

  await browser.close();
})();

