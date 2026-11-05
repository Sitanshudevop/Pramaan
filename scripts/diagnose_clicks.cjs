const path = require('path');
const { chromium } = require(path.resolve('./frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.toString()}`);
  });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  console.log('Page Title:', await page.title());
  console.log('Page URL:', page.url());

  // Check console errors
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  // Find a button on Home
  const btn = page.locator('button:has-text("Try a sample review")');
  const count = await btn.count();
  console.log('"Try a sample review" button count:', count);

  if (count > 0) {
    const box = await btn.boundingBox();
    console.log('Button bounding box:', box);

    if (box) {
      const elAtPoint = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tagName: el.tagName, className: el.className, id: el.id, textContent: el.textContent?.slice(0, 30) } : null;
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      console.log('Element at point of button:', elAtPoint);
    }

    console.log('Attempting to click "Try a sample review"...');
    try {
      await btn.click({ timeout: 3000 });
      console.log('Clicked! New URL:', page.url());
    } catch (e) {
      console.log('Click failed:', e.message);
    }
  }

  // Now check Sidebar links
  console.log('Checking sidebar items...');
  const newReviewLink = page.locator('aside a[href="/app/new"]');
  console.log('New review link count in sidebar:', await newReviewLink.count());
  if (await newReviewLink.count() > 0) {
    const box = await newReviewLink.boundingBox();
    console.log('Sidebar New Review link bounding box:', box);
    if (box) {
      const elAtPoint = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tagName: el.tagName, className: el.className, textContent: el.textContent?.slice(0, 30) } : null;
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      console.log('Element at point of sidebar link:', elAtPoint);
    }

    try {
      await newReviewLink.click({ timeout: 3000 });
      console.log('Sidebar link clicked! New URL:', page.url());
    } catch (e) {
      console.log('Sidebar link click failed:', e.message);
    }
  }

  // Test other pages: /app/new
  console.log('Navigating to http://localhost:5173/app/new ...');
  await page.goto('http://localhost:5173/app/new', { waitUntil: 'networkidle' });
  console.log('NewReview URL:', page.url());

  // Check buttons on NewReview
  const sampleBtn = page.locator('button:has-text("Kettle & Co.")').first();
  console.log('Sample kit button count:', await sampleBtn.count());
  if (await sampleBtn.count() > 0) {
    try {
      await sampleBtn.click({ timeout: 3000 });
      console.log('Sample kit button clicked successfully!');
    } catch (e) {
      console.log('Sample kit button click failed:', e.message);
    }
  }

  // Check role switcher
  const roleSelect = page.locator('select[aria-label="Role selector"]');
  console.log('Role selector count:', await roleSelect.count());

  await browser.close();
})();
