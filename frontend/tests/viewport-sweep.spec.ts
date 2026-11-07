import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px (iPhone SE 1st gen)', width: 320, height: 568 },
  { name: '360px (Galaxy S8)', width: 360, height: 740 },
  { name: '390px (iPhone 14)', width: 390, height: 844 },
  { name: '414px (iPhone Plus)', width: 414, height: 896 },
  { name: '600px (small tablet portrait)', width: 600, height: 960 },
  { name: '768px (iPad portrait)', width: 768, height: 1024 },
  { name: '820px (iPad Air)', width: 820, height: 1180 },
  { name: '1024px (small laptop / iPad landscape)', width: 1024, height: 768 },
  { name: '1280px (standard laptop)', width: 1280, height: 800 },
  { name: '1440px (desktop)', width: 1440, height: 900 },
  { name: '1920px (FHD desktop)', width: 1920, height: 1080 },
  { name: '2560px (QHD ultra-wide)', width: 2560, height: 1440 },
  { name: '844x390px (iPhone 14 landscape)', width: 844, height: 390 },
];

const _ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/app/new', name: 'New Review' },
  { path: '/app/queue', name: 'Review Queue' },
  { path: '/app/hub', name: 'Brand Hub' },
  { path: '/app/audit', name: 'Audit & Disclosure' },
  { path: '/app/insights', name: 'Insights' },
  { path: '/app/team', name: 'Team' },
  { path: '/app/settings', name: 'Settings' },
  { path: '/about', name: 'About' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms' },
  { path: '/ethics', name: 'AI Ethics' },
];

test.describe('Responsive Viewport Sweep & No Horizontal Overflow', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): Key pages load without horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // Test a representative set of rich pages across all viewports
      const sampleRoutes = ['/', '/app/new', '/app/queue', '/app/hub', '/app/audit', '/app/insights', '/app/settings'];

      for (const route of sampleRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('domcontentloaded');

        // Verify no horizontal overflow on root
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (isOverflowing) {
          const culprits = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            const wide = all.filter(el => el.clientWidth > window.innerWidth || el.scrollWidth > window.innerWidth);
            return wide.map(el => ({
              tag: el.tagName,
              id: el.id,
              className: el.className ? String(el.className).slice(0, 80) : '',
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              outerHTML: el.outerHTML.slice(0, 120),
            })).slice(-5); // get innermost
          });
          console.error(`Innermost overflow culprits on ${route} at ${vp.width}px:`, JSON.stringify(culprits, null, 2));
        }

        expect(isOverflowing, `Route ${route} overflowed horizontally at ${vp.width}px`).toBe(false);

        // Verify h1 or main heading is present and visible
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();

        // No uncaught exceptions
        expect(errors).toHaveLength(0);
      }
    });
  }
});

test.describe('Touch Target Accessibility on Mobile (390px)', () => {
  test('Primary buttons and navigational controls satisfy min touch target or padding (>=44x44px or >=40px with touch area)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Hamburger button touch target
    const hamburger = page.locator('header button[aria-controls="app-navigation"]');
    const hamburgerBox = await hamburger.boundingBox();
    expect(hamburgerBox).not.toBeNull();
    if (hamburgerBox) {
      expect(hamburgerBox.width).toBeGreaterThanOrEqual(40);
      expect(hamburgerBox.height).toBeGreaterThanOrEqual(40);
    }

    // Primary action button on home
    const primaryCta = page.locator('button:has-text("Create your workspace"), button:has-text("Go to"), button:has-text("Try a sample review")').first();
    const ctaBox = await primaryCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    if (ctaBox) {
      expect(ctaBox.height).toBeGreaterThanOrEqual(40);
      expect(ctaBox.width).toBeGreaterThanOrEqual(44);
    }
  });
});
