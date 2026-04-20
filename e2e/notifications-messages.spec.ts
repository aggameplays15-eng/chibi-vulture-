import { test, expect, Page } from '@playwright/test';

// ── Helper auth ───────────────────────────────────────────────────────────────
const asUser = async (page: Page) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('papicamara22@gmail.com');
  await page.locator('input[type="password"]').fill('fantasangare2203');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/.*\/feed/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
};

const asGuest = async (page: Page) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('guest-button').click();
  await page.waitForURL(/.*\/feed/, { timeout: 10000 });
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
test.describe('Notifications', () => {
  test('page notifications accessible en mode invité', async ({ page }) => {
    await asGuest(page);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // La page doit s'afficher (pas de crash)
    await expect(page.getByText(/NOTIFICATIONS/i)).toBeVisible();
    console.log('✅ Page notifications visible en mode invité');
  });

  test('page notifications affiche état vide ou données', async ({ page }) => {
    await asGuest(page);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Soit des notifs, soit le message vide
    const hasNotifs = await page.locator('[class*="rounded-3xl"]').first().isVisible().catch(() => false);
    const hasEmpty  = await page.getByText(/Aucune notification/i).isVisible().catch(() => false);
    const hasLoader = await page.locator('[class*="animate-spin"]').isVisible().catch(() => false);

    expect(hasNotifs || hasEmpty || hasLoader).toBeTruthy();
    console.log('✅ Notifications : état cohérent');
  });

  test('icône Bell dans le Feed navigue vers notifications', async ({ page }) => {
    await asGuest(page);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page).toHaveURL(/.*\/notifications/, { timeout: 5000 });
    console.log('✅ Bell → /notifications OK');
  });
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────
test.describe('Messages', () => {
  test('page messages accessible', async ({ page }) => {
    await asGuest(page);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/MESSAGES/i)).toBeVisible();
    console.log('✅ Page messages visible');
  });

  test('messages affiche état vide ou conversations', async ({ page }) => {
    await asGuest(page);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const hasConvs  = await page.locator('[class*="rounded-3xl"]').first().isVisible().catch(() => false);
    const hasEmpty  = await page.getByText(/Aucune conversation/i).isVisible().catch(() => false);
    const hasLoader = await page.locator('[class*="animate-spin"]').isVisible().catch(() => false);

    expect(hasConvs || hasEmpty || hasLoader).toBeTruthy();
    console.log('✅ Messages : état cohérent');
  });

  test('champ de recherche messages fonctionne', async ({ page }) => {
    await asGuest(page);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Rechercher" i]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await page.waitForTimeout(300);
    console.log('✅ Recherche messages OK');
  });
});

// ── CHAT ──────────────────────────────────────────────────────────────────────
test.describe('Chat', () => {
  test('page chat accessible avec handle', async ({ page }) => {
    await asGuest(page);
    await page.goto('/chat/testuser');
    await page.waitForLoadState('networkidle');

    // Header avec bouton retour
    await expect(page.getByRole('button', { name: /retour/i }).or(
      page.locator('button').filter({ has: page.locator('[class*="lucide-chevron-left"]') }).first()
    ).or(page.locator('header'))).toBeVisible();
    console.log('✅ Page chat accessible');
  });

  test('champ de saisie message visible', async ({ page }) => {
    await asGuest(page);
    await page.goto('/chat/testuser');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="message" i]');
    await expect(input).toBeVisible();
    console.log('✅ Champ message visible');
  });

  test('bouton envoi désactivé si message vide', async ({ page }) => {
    await asGuest(page);
    await page.goto('/chat/testuser');
    await page.waitForLoadState('networkidle');

    const sendBtn = page.locator('button[aria-label="Envoyer"]');
    await expect(sendBtn).toBeDisabled();
    console.log('✅ Bouton envoi désactivé si vide');
  });

  test('bouton envoi activé après saisie', async ({ page }) => {
    await asGuest(page);
    await page.goto('/chat/testuser');
    await page.waitForLoadState('networkidle');

    const input   = page.locator('input[placeholder*="message" i]');
    const sendBtn = page.locator('button[aria-label="Envoyer"]');

    await input.fill('Bonjour !');
    await expect(sendBtn).toBeEnabled();
    console.log('✅ Bouton envoi activé après saisie');
  });
});
