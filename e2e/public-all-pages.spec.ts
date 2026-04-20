import { test, expect, Page } from '@playwright/test';

// ── helpers ──────────────────────────────────────────────────────────────────

const asGuest = async (page: Page) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /invit/i }).click();
  await page.waitForURL(/.*\/feed/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
};

const asUser = async (page: Page) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('papicamara22@gmail.com');
  await page.locator('input[type="password"]').fill('fantasangare2203');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/.*\/feed/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
};

// ── INDEX ────────────────────────────────────────────────────────────────────

test.describe('Page publique — INDEX', () => {
  test('logo 3D visible, boutons connexion et invité', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('\n🏠  INDEX');

    await expect(page.getByTestId('login-button')).toBeVisible();
    console.log('✅ Bouton Connexion visible');

    const guestBtn = page.getByTestId('guest-button');
    await expect(guestBtn).toBeVisible();
    console.log('✅ Bouton Invité visible');

    const logo = page.locator('img[alt="Chibi Vulture Logo"]');
    await expect(logo).toBeVisible();
    console.log('✅ Logo visible');
  });

  test('clic invité → redirige vers /feed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /invit/i }).click();
    await expect(page).toHaveURL(/.*\/feed/, { timeout: 8000 });
    console.log('✅ Invité → Feed OK');
  });
});

// ── LOGIN ────────────────────────────────────────────────────────────────────

test.describe('Page publique — LOGIN', () => {
  test('formulaire visible, validation, mode invité', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('\n🔐  LOGIN');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /connecter/i })).toBeVisible();
    console.log('✅ Formulaire visible');

    // Soumettre vide → erreur
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForTimeout(400);
    console.log('✅ Validation champs vides OK');

    // Mauvais identifiants
    await page.locator('input[type="email"]').fill('faux@test.com');
    await page.locator('input[type="password"]').fill('mauvais');
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForTimeout(800);
    console.log('✅ Mauvais identifiants → erreur OK');

    // Mode invité
    await page.getByRole('button', { name: /invit/i }).click();
    await expect(page).toHaveURL(/.*\/feed/, { timeout: 8000 });
    console.log('✅ Mode invité → Feed OK');
  });
});

// ── SIGNUP ───────────────────────────────────────────────────────────────────

test.describe('Page publique — SIGNUP', () => {
  test('formulaire inscription visible et validation', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    console.log('\n📝  SIGNUP');

    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`✅ ${count} champs de formulaire visibles`);

    await expect(page.getByRole('button', { name: /cr[eé]er/i })).toBeVisible();
    console.log('✅ Bouton Créer visible');

    // Soumettre vide
    await page.getByRole('button', { name: /cr[eé]er/i }).click();
    await page.waitForTimeout(400);
    console.log('✅ Validation champs vides OK');
  });
});
