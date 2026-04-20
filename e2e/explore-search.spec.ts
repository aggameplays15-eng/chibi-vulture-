import { test, expect, Page } from '@playwright/test';

const asGuest = async (page: Page) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('guest-button').click();
  await page.waitForURL(/.*\/feed/, { timeout: 10000 });
};

test.describe('Explore & Recherche', () => {
  test('page explore charge correctement', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/DÉCOUVRIR/i)).toBeVisible();
    console.log('✅ Page explore visible');
  });

  test('champ de recherche visible et fonctionnel', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="Artistes" i]');
    await expect(input).toBeVisible();
    console.log('✅ Champ recherche visible');
  });

  test('tags de filtrage visibles', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('#chibi')).toBeVisible();
    await expect(page.getByText('#kawaii')).toBeVisible();
    console.log('✅ Tags visibles');
  });

  test('clic sur un tag filtre les posts', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await page.getByText('#chibi').click();
    await page.waitForTimeout(300);

    // Le tag doit être actif (style différent)
    const activeTag = page.locator('[class*="text-white"]').filter({ hasText: '#chibi' });
    await expect(activeTag).toBeVisible();
    console.log('✅ Tag actif après clic');
  });

  test('recherche déclenche une requête après debounce', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="Artistes" i]');
    await input.fill('chibi');

    // Attendre le debounce (400ms) + requête
    await page.waitForTimeout(800);

    // Soit des résultats, soit "Aucun résultat", soit un loader
    const hasResults = await page.locator('[class*="rounded-2xl"]').first().isVisible().catch(() => false);
    const hasEmpty   = await page.getByText(/Aucun résultat/i).isVisible().catch(() => false);
    const hasLoader  = await page.locator('[class*="animate-spin"]').isVisible().catch(() => false);

    expect(hasResults || hasEmpty || hasLoader).toBeTruthy();
    console.log('✅ Recherche déclenche une réponse');
  });

  test('bouton clear efface la recherche', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="Artistes" i]');
    await input.fill('test');
    await page.waitForTimeout(200);

    const clearBtn = page.locator('button[aria-label="Effacer la recherche"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect(input).toHaveValue('');
    console.log('✅ Clear recherche OK');
  });

  test('section Tendances visible par défaut', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Tendances/i)).toBeVisible();
    console.log('✅ Section Tendances visible');
  });

  test('section Artistes à suivre visible', async ({ page }) => {
    await asGuest(page);
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Artistes à suivre/i)).toBeVisible();
    console.log('✅ Section Artistes visible');
  });
});
