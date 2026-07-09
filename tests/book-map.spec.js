const { test, expect } = require('@playwright/test');

test.describe('Book Map UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8977/index-book-map.html');
  });

  test('page loads with header', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toContainText('Book Map');
  });

  test('books grid is rendered', async ({ page }) => {
    const grid = page.locator('#booksGrid');
    await expect(grid).toBeVisible();

    const cards = page.locator('.book-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking book card shows details panel', async ({ page }) => {
    const firstCard = page.locator('.book-card').first();
    await firstCard.click();

    const panel = page.locator('#bookDetailsPanel');
    await expect(panel).toBeVisible();
  });

  test('tab switching works', async ({ page }) => {
    const firstCard = page.locator('.book-card').first();
    await firstCard.click();

    const conceptsTab = page.locator('button[data-tab="concepts"]');
    await conceptsTab.click();

    await expect(conceptsTab).toHaveClass(/active/);
  });

  test('close button hides details panel', async ({ page }) => {
    const firstCard = page.locator('.book-card').first();
    await firstCard.click();

    const panel = page.locator('#bookDetailsPanel');
    await expect(panel).toBeVisible();

    const closeBtn = page.locator('#closeDetailsBtn');
    await closeBtn.click();

    await expect(panel).not.toBeVisible();
  });
});
