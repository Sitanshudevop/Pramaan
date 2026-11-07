import { test, expect } from '@playwright/test';
import path from 'path';

const WIDTHS = [360, 390, 414, 480, 520, 560, 600, 640, 700, 768, 900, 1000, 1023, 1024];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'new-review', path: '/app/new' },
  { name: 'queue', path: '/app/queue' },
  { name: 'hub', path: '/app/hub' },
  { name: 'audit', path: '/app/audit' },
  { name: 'insights', path: '/app/insights' },
  { name: 'team', path: '/app/team' },
  { name: 'settings', path: '/app/settings' },
  { name: 'about', path: '/about' },
];

test.describe('FIX 2: Responsive Viewport Sweep, No Cut-Off Content & Hamburger Visibility', () => {
  for (const width of WIDTHS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`Width ${width}px [${theme} theme]: DOM bounds, no clipped text, and hamburger breakpoint checks`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });

        for (const route of ROUTES) {
          await page.goto(`http://localhost:5173${route.path}`);
          await page.waitForLoadState('domcontentloaded');

          // Apply theme
          if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.classList.add('dark'));
          } else {
            await page.evaluate(() => document.documentElement.classList.remove('dark'));
          }
          await page.waitForTimeout(50);

          // 1. Assert Hamburger visibility rule based strictly on 1024px breakpoint
          const hamburger = page.locator('header button[aria-label*="navigation menu"]');
          if (width >= 1024) {
            await expect(hamburger).not.toBeVisible();
          } else {
            await expect(hamburger).toBeVisible();
          }

          // 2. Walk DOM and assert no element outside [data-scrollable] has right > clientWidth + 1
          const overflows = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];
            return all
              .filter((el) => {
                if (el.closest('[data-scrollable]')) return false;
                if (el.classList.contains('sr-only')) return false;
                const rect = el.getBoundingClientRect();
                return rect.right > docWidth + 1;
              })
              .map((el) => ({
                tag: el.tagName,
                cls: el.className ? String(el.className).slice(0, 80) : '',
                right: Math.round(el.getBoundingClientRect().right),
                docWidth,
                text: (el.textContent || '').trim().slice(0, 50),
              }));
          });

          expect(
            overflows,
            `Found horizontal overflows on ${route.name} at ${width}px (${theme}): ${JSON.stringify(overflows)}`
          ).toHaveLength(0);

          // 3. Assert no card text container is clipped by overflow hidden
          const clippedCardText = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.rounded-card p, .rounded-card .break-anywhere')) as HTMLElement[];
            return cards
              .filter((el) => {
                const style = window.getComputedStyle(el);
                const isOverflowHidden = style.overflowX === 'hidden' || style.overflow === 'hidden';
                return isOverflowHidden && el.scrollWidth > el.clientWidth + 1;
              })
              .map((el) => ({
                tag: el.tagName,
                text: (el.textContent || '').trim().slice(0, 50),
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
              }));
          });

          expect(
            clippedCardText,
            `Found clipped card text on ${route.name} at ${width}px: ${JSON.stringify(clippedCardText)}`
          ).toHaveLength(0);

          // 4. Save screenshots at 480 and 560px into docs/screenshots/
          if (width === 480 || width === 560) {
            const screenshotPath = path.resolve(
              process.cwd(),
              '..',
              'docs',
              'screenshots',
              `${route.name}-${width}px-${theme}.png`
            );
            await page.screenshot({ path: screenshotPath, fullPage: true });
          }
        }
      });
    }
  }
});
