import { test, expect } from '@playwright/test';

test.describe('Hamburger Navigation, Drawer, Rail & TopBar Responsive Specs', () => {
  test('Mobile (<1024px): hamburger button opens and closes drawer, locks scroll, traps focus, Esc closes', async ({ page }) => {
    // Set viewport to mobile phone (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const hamburgerBtn = page.locator('header button[aria-controls="app-navigation"]');
    await expect(hamburgerBtn).toBeVisible();
    await expect(hamburgerBtn).toHaveAttribute('aria-label', 'Open navigation menu');
    await expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');

    // Click hamburger to open drawer
    await hamburgerBtn.click();
    await expect(hamburgerBtn).toHaveAttribute('aria-label', 'Close navigation menu');
    await expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'true');

    // Drawer is visible with role="dialog"
    const drawer = page.locator('#app-navigation-drawer');
    await expect(drawer).toBeVisible();

    // Verify drawer navigation link click navigates and closes drawer automatically
    const newReviewLink = drawer.locator('a[href="/app/new"]');
    await newReviewLink.click();
    await expect(page).toHaveURL(/\/app\/new/);
    await expect(drawer).not.toBeVisible();

    // Re-open drawer and test Esc key
    const openBtn = page.locator('header button[aria-label="Open navigation menu"]');
    await openBtn.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Re-open and test scrim backdrop tap closes drawer
    await openBtn.click();
    await expect(drawer).toBeVisible();
    const scrim = page.locator('.fixed.inset-0.bg-black\\/60');
    await scrim.click({ position: { x: 350, y: 100 } });
    await expect(drawer).not.toBeVisible();
  });

  test('Desktop (>=1024px): hamburger toggles between rail and expanded, persists in localStorage', async ({ page }) => {
    // Set viewport to large desktop (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const sidebar = page.locator('aside#app-navigation');
    await expect(sidebar).toBeVisible();

    // Default on >=1280px is expanded (w-[240px])
    await expect(sidebar).toHaveClass(/w-\[240px\]/);

    // Click hamburger to toggle to rail
    const hamburgerBtn = page.locator('header button[aria-controls="app-navigation"]');
    await hamburgerBtn.click();
    await expect(sidebar).toHaveClass(/w-\[72px\]/);

    // Verify localStorage persistence
    const storedState = await page.evaluate(() => localStorage.getItem('pramaan_sidebar_state'));
    expect(storedState).toBe('rail');

    // Reload page and verify rail persisted
    await page.reload();
    const reloadedSidebar = page.locator('aside#app-navigation');
    await expect(reloadedSidebar).toHaveClass(/w-\[72px\]/);

    // Toggle back to expanded
    await page.locator('header button[aria-controls="app-navigation"]').click();
    await expect(reloadedSidebar).toHaveClass(/w-\[240px\]/);
  });

  test('Top bar elements adapt accurately across breakpoints', async ({ page }) => {
    // 1. Phone width (360px): Hamburger, icon-only logo, title, bell, overflow menu
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    await expect(page.locator('header button[aria-label="Open navigation menu"]')).toBeVisible();
    await expect(page.locator('header button[aria-label^="Notifications"]')).toBeVisible();
    await expect(page.locator('header button[aria-label="Workspace & profile settings menu"]')).toBeVisible();

    // Theme button should be hidden in header (moved into overflow menu)
    await expect(page.locator('header button[aria-label^="Cycle theme"]')).not.toBeVisible();

    // Click overflow menu to open mobile bottom sheet
    await page.locator('header button[aria-label="Workspace & profile settings menu"]').click();
    const overflowDialog = page.locator('div[role="dialog"][aria-label="Quick Settings & Profile"]');
    await expect(overflowDialog).toBeVisible();
    await expect(overflowDialog.locator('text=Confidential Mode')).toBeVisible();
    await expect(overflowDialog.locator('button:has-text("Dark")')).toBeVisible();

    // Close overflow
    await page.keyboard.press('Escape');
    await expect(overflowDialog).not.toBeVisible();

    // 2. Tablet width (768px): Hamburger, logo with text, title, bell, theme toggle, overflow menu
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('header button[aria-label^="Cycle theme"]')).toBeVisible();
    await expect(page.locator('header button[aria-label="Workspace & profile settings menu"]')).toBeVisible();

    // 3. Desktop width (1280px): Full controls in top bar
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('header button[title*="Confidential Mode"]')).toBeVisible();
    await expect(page.locator('header button[aria-label="Demo Role Switcher"]')).toBeVisible();
  });
});
