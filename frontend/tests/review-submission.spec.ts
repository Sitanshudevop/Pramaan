import { test, expect } from '@playwright/test';

test.describe('Pramaan Review Submission Guardrails & Role Permissions', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start in a clean state in the demo workspace
    await page.goto('/');
  });

  test('Empty draft shows inline validation message and focuses textarea', async ({ page }) => {
    await page.goto('/app/new');

    // Ensure role is Creator
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Creator');

    // Clear content if anything was pre-filled
    const textarea = page.locator('#content-input');
    await textarea.fill('');

    // Attempt to submit
    const runBtn = page.locator('button:has-text("Run Review")');
    await runBtn.click();

    // Verify inline validation message
    const errorMsg = page.locator('text=Add draft text or choose a sample.');
    await expect(errorMsg).toBeVisible();

    // Verify textarea is focused
    await expect(textarea).toBeFocused();

    // Verify we remain on /app/new without silent navigation
    await expect(page).toHaveURL(/\/app\/new/);
  });

  test('Reviewer persona cannot submit: button is disabled with visible reason and one-click switch', async ({ page }) => {
    await page.goto('/app/new');

    // Switch role to Reviewer
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Reviewer');

    // Verify Run Review button is disabled
    const runBtn = page.locator('button:has-text("Run Review")');
    await expect(runBtn).toBeDisabled();

    // Verify the visible warning reason
    const warningNotice = page.locator("text=Your role (Reviewer) can't submit drafts");
    await expect(warningNotice).toBeVisible();

    // Verify the one-click action to switch to Creator exists
    const switchBtn = page.locator('button:has-text("View as Priya Nair (Creator)")').first();
    await expect(switchBtn).toBeVisible();

    // Click to switch persona
    await switchBtn.click();

    // Verify button becomes enabled for Creator
    await expect(runBtn).toBeEnabled();
  });

  test('Admin persona cannot submit: button is disabled with visible reason', async ({ page }) => {
    await page.goto('/app/new');

    // Switch role to Admin
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Admin');

    // Verify Run Review button is disabled
    const runBtn = page.locator('button:has-text("Run Review")');
    await expect(runBtn).toBeDisabled();

    // Verify the visible warning reason
    const warningNotice = page.locator("text=Your role (Admin) can't submit drafts");
    await expect(warningNotice).toBeVisible();
  });

  test('Try Sample chips auto-switch role to Creator with toast when Reviewer clicks', async ({ page }) => {
    await page.goto('/app/new');

    // Set role to Reviewer
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Reviewer');

    // Click Sample 1 chip
    const sampleChip = page.locator('button:has-text("Sample 1")');
    await sampleChip.click();

    // Toast appears confirming role switch
    const toast = page.locator('text=Switched role to Creator to submit this sample.');
    await expect(toast).toBeVisible();

    // Run Review button is now enabled
    const runBtn = page.locator('button:has-text("Run Review")');
    await expect(runBtn).toBeEnabled();
  });

  test('Home page "Try a sample review" button switches role to Creator', async ({ page }) => {
    // Set role to Reviewer
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Reviewer');

    await page.goto('/');

    const trySampleBtn = page.locator('button:has-text("Try a sample review")');
    await trySampleBtn.click();

    await expect(page).toHaveURL(/\/app\/new/);
    const toast = page.locator('text=Switched role to Creator (Priya Nair) to submit sample reviews.');
    await expect(toast).toBeVisible();
  });

  test('Creator persona can submit and lands on review findings page', async ({ page }) => {
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Creator');

    await page.goto('/app/new');
    await page.locator('button:has-text("Sample 1")').click();

    const runBtn = page.locator('button:has-text("Run Review")');
    await expect(runBtn).toBeEnabled();
    await runBtn.click();

    // Lands on /app/review/:id
    await expect(page).toHaveURL(/\/app\/review\//, { timeout: 12000 });
    await expect(page.locator('h1')).toContainText('Review');
    await expect(page.locator('text=Evidence Coverage')).toBeVisible();
  });

  test('Brand manager persona can submit and lands on review findings page', async ({ page }) => {
    const roleSelect = page.locator('header select[aria-label="Demo Role Switcher"]');
    await roleSelect.selectOption('Brand manager');

    await page.goto('/app/new');
    await page.locator('button:has-text("Sample 2")').click();

    const runBtn = page.locator('button:has-text("Run Review")');
    await expect(runBtn).toBeEnabled();
    await runBtn.click();

    // Lands on /app/review/:id
    await expect(page).toHaveURL(/\/app\/review\//, { timeout: 12000 });
    await expect(page.locator('h1')).toContainText('Review');
  });

  test('Direct API submission returns 403 for Reviewer and Admin', async ({ request }) => {
    const payload = {
      brand_kit_id: 'kettle-and-co',
      content: 'Fresh organic Masala Chai brewed daily for tea enthusiasts.',
      content_type: 'Promotional Email',
      purpose_card: {
        goal: 'Direct API security test',
        audience: 'Auditors',
        key_message: 'Testing role gates',
        call_to_action: 'Order today at kettleandco.example',
        locked_phrases: ['Masala Chai'],
        content_type: 'Promotional Email',
        ai_declared: false,
      },
      ai_declared: false,
    };

    // Reviewer -> 403 Forbidden
    const reviewerRes = await request.post('http://localhost:8000/api/reviews', {
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Role': 'Reviewer',
        'X-Workspace-Id': 'ws-demo',
      },
      data: payload,
    });
    expect(reviewerRes.status()).toBe(403);
    const reviewerBody = await reviewerRes.json();
    expect(reviewerBody.detail.error.code).toBe('FORBIDDEN');

    // Admin -> 403 Forbidden
    const adminRes = await request.post('http://localhost:8000/api/reviews', {
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Role': 'Admin',
        'X-Workspace-Id': 'ws-demo',
      },
      data: payload,
    });
    expect(adminRes.status()).toBe(403);
    const adminBody = await adminRes.json();
    expect(adminBody.detail.error.code).toBe('FORBIDDEN');

    // Creator -> 201 Created
    const creatorRes = await request.post('http://localhost:8000/api/reviews', {
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Role': 'Creator',
        'X-Workspace-Id': 'ws-demo',
      },
      data: payload,
    });
    expect(creatorRes.status()).toBe(201);
  });
});
