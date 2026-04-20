import { test, expect, Page } from '@playwright/test';

const asGuest = async (page: Page) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('guest-button').click();
  await page.waitForURL(/.*\/feed/, { timeout: 10000 });
};

// ── 404 ───────────────────────────────────────────────────────────────────────
test.describe('Page 404', () => {
  test('route inexistante affiche la page 404', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText(/PAGE INTROUVABLE/i)).toBeVisible();
    console.log('✅ Page 404 visible');
  });

  test('bouton Accueil sur 404 redirige vers /feed', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Accueil/i }).click();
    await expect(page).toHaveURL(/.*\/feed/, { timeout: 8000 });
    console.log('✅ 404 → Accueil OK');
  });

  test('bouton Retour sur 404 fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.goto('/cette-page-nexiste-pas');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Retour/i }).click();
    await page.waitForTimeout(500);
    // Doit naviguer en arrière (vers /)
    const url = page.url();
    expect(url).not.toContain('cette-page-nexiste-pas');
    console.log('✅ Bouton Retour OK');
  });
});

// ── SETTINGS ──────────────────────────────────────────────────────────────────
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Injecter le user avant le chargement
    await page.addInitScript(() => {
      localStorage.setItem('cv_user', JSON.stringify({
        id: 1, name: 'TestUser', handle: '@test', bio: '', avatarColor: '#EC4899',
        role: 'Member', isApproved: true, isAuthenticated: true, isGuest: false,
        status: 'Actif', following: []
      }));
      localStorage.setItem('cv_token', 'test-token');
    });
    // Mocker les appels API pour éviter qu'ils écrasent le state
    await page.route('/api/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]'
    }));
  });

  test('page settings accessible', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/PARAMÈTRES/i)).toBeVisible({ timeout: 8000 });
    console.log('✅ Page settings visible');
  });

  test('toggle dark mode visible et fonctionnel', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Mode sombre/i)).toBeVisible({ timeout: 8000 });

    const toggle = page.locator('button[role="switch"]').nth(1);
    await toggle.click();
    await page.waitForTimeout(300);
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDark).toBeTruthy();
    console.log('✅ Dark mode activé');

    await toggle.click();
    await page.waitForTimeout(300);
    const hasDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkAfter).toBeFalsy();
    console.log('✅ Dark mode désactivé');
  });

  test('toggle notifications visible', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Notifications/i)).toBeVisible({ timeout: 8000 });
    const toggle = page.locator('button[role="switch"]').first();
    await expect(toggle).toBeVisible();
    console.log('✅ Toggle notifications visible');
  });

  test('lien Compte navigue vers edit-profile', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.getByText('Compte').click();
    await expect(page).toHaveURL(/.*\/edit-profile/, { timeout: 8000 });
    console.log('✅ Compte → /edit-profile OK');
  });

  test('bouton déconnexion redirige vers /', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /DÉCONNEXION/i }).click();
    await expect(page).toHaveURL('/', { timeout: 8000 });
    console.log('✅ Déconnexion → / OK');
  });
});
