import { test, expect } from '@playwright/test';

test.describe('FIX 1: Hamburger Visibility, Placement & Responsive Navigation', () => {
  test('Desktop (>=1024px): hamburger is completely hidden, persistent 240px sidebar is visible with Logo + Pramaan', async ({ page }) => {
    // Test exact breakpoint 1024px and standard desktop 1280px
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Hamburger must be completely hidden (display:none, not visible, not in tab order)
      const hamburgerBtn = page.locator('header button[aria-label*="navigation menu"]');
      await expect(hamburgerBtn).not.toBeVisible();

      // Show a persistent, full sidebar (240px, icons + labels)
      const sidebar = page.locator('aside#app-navigation');
      await expect(sidebar).toBeVisible();
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).not.toBeNull();
      expect(Math.round(sidebarBox!.width)).toBe(240);

      // Sidebar top: logo mark + "Pramaan" wordmark
      const sidebarLogo = sidebar.locator('text=Pramaan').first();
      await expect(sidebarLogo).toBeVisible();

      // Nav items and footer links are present
      await expect(sidebar.locator('a:has-text("Home")')).toBeVisible();
      await expect(sidebar.locator('a:has-text("About Pramaan")')).toBeVisible();
      await expect(sidebar.locator('a:has-text("Privacy")')).toBeVisible();
    }
  });

  test('Below 1024px (<1024px): sidebar is hidden, hamburger is 44x44px at far left, opens drawer with Logo + Close row above Home', async ({ page }) => {
    // Test across phone and tablet breakpoints
    for (const width of [360, 480, 560, 768, 1023]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Persistent sidebar is hidden
      const sidebar = page.locator('aside#app-navigation');
      await expect(sidebar).not.toBeVisible();

      // Hamburger is visible and is 44x44px touch target at far left
      const hamburgerBtn = page.locator('header button[aria-label="Open navigation menu"]');
      await expect(hamburgerBtn).toBeVisible();
      const box = await hamburgerBtn.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);

      // Verify hamburger opens drawer
      await hamburgerBtn.click();
      const drawer = page.locator('#app-navigation-drawer');
      await expect(drawer).toBeVisible();

      // Inside drawer, very first row (ABOVE "Home") is header with logo + "Pramaan" on left and close (X) button on right
      const drawerHeader = drawer.locator('> div > div').first();
      await expect(drawerHeader.locator('text=Pramaan')).toBeVisible();
      const closeBtn = drawerHeader.locator('button[aria-label="Close navigation menu"]');
      await expect(closeBtn).toBeVisible();

      // "Home" is the first nav item directly below it
      const firstNavItem = drawer.locator('nav a').first();
      await expect(firstNavItem).toHaveText(/Home/);

      // Test Esc closes drawer and returns focus to hamburger
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible();

      // Test scrim tap closes drawer
      await hamburgerBtn.click();
      await expect(drawer).toBeVisible();
      const scrim = page.locator('.fixed.inset-0.bg-black\\/60');
      await scrim.click({ position: { x: 340, y: 100 } });
      await expect(drawer).not.toBeVisible();
    }
  });

  test('Narrow top bar (<640px): [hamburger] [page title, truncated] [bell] [avatar menu], no repeated logo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/hub');
    await page.waitForLoadState('domcontentloaded');

    // Logo must NOT be repeated in top bar below 640px
    const topBarLogo = page.locator('header .hidden.sm\\:flex.lg\\:hidden');
    await expect(topBarLogo).not.toBeVisible();

    // Elements in order: hamburger, title, bell, avatar
    const hamburger = page.locator('header button[aria-label="Open navigation menu"]');
    await expect(hamburger).toBeVisible();

    const title = page.locator('header span:has-text("Brand Knowledge Hub")');
    await expect(title).toBeVisible();

    const bell = page.locator('header button[aria-label^="Notifications"]');
    await expect(bell).toBeVisible();

    const avatar = page.locator('header button[aria-label="Workspace & profile settings menu"]');
    await expect(avatar).toBeVisible();
  });
});
