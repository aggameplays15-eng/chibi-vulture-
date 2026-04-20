import { test, expect, Page } from '@playwright/test';

test.describe('App Settings - Admin', () => {
  // Helper pour simuler l'authentification admin
  const setupAdminAuth = async (page: Page) => {
    await page.addInitScript(() => {
      localStorage.setItem('cv_token', 'mock-admin-token');
      localStorage.setItem('cv_user', JSON.stringify({
        id: 1,
        email: 'papicamara22@gmail.com',
        role: 'Admin',
        name: 'Admin',
        handle: '@admin',
        isApproved: true,
        isAuthenticated: true,
        isGuest: false,
        bio: 'Admin account',
        avatarColor: '#DC2626',
        status: 'Actif',
        following: []
      }));
    });
  };

  test.beforeEach(async ({ page }) => {
    // Mock API get app settings
    await page.route('/api/app-settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            app_name: 'Chibi Vulture',
            app_logo: '/favicon.ico',
            app_description: 'Le réseau social artistique',
            primary_color: '#EC4899'
          })
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Settings updated' })
        });
      }
    });
  });

  test('admin can access appearance settings tab', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click sur l'onglet appearance - utiliser le sélecteur Radix UI ou l'icône
    const appearanceTab = page.locator('button[role="tab"]').filter({ hasText: /Apparence/i }).or(
      page.locator('button[role="tab"]').nth(6)
    );
    await expect(appearanceTab).toBeVisible();
    await appearanceTab.click();

    // Vérifier qu'on est sur l'onglet appearance
    await expect(page.getByText(/Nom de l'Application/i)).toBeVisible();
  });

  test('app name field is present and editable', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier le champ nom
    const nameInput = page.getByPlaceholder(/Chibi Vulture/i);
    await expect(nameInput).toBeVisible();

    // Modifier le nom
    await nameInput.clear();
    await nameInput.fill('Mon Nouveau App');
    const value = await nameInput.inputValue();
    expect(value).toBe('Mon Nouveau App');
  });

  test('app description field is present and editable', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier le champ description
    const descInput = page.getByPlaceholder(/Le réseau social artistique/i);
    await expect(descInput).toBeVisible();

    // Modifier la description
    await descInput.clear();
    await descInput.fill('Nouvelle description');
    const value = await descInput.inputValue();
    expect(value).toBe('Nouvelle description');
  });

  test('logo upload button is present', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier le bouton de changement de logo
    const logoButton = page.getByRole('button', { name: /CHANGER LE LOGO/i });
    await expect(logoButton).toBeVisible();
  });

  test('color picker displays preset colors', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier les couleurs prédéfinies (7 couleurs)
    const colorButtons = page.locator('button[class*="rounded-full"]');
    const count = await colorButtons.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('custom color picker is present', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier l'input de couleur personnalisée
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();
  });

  test('preview updates in real-time', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Modifier le nom
    await page.getByPlaceholder(/Chibi Vulture/i).fill('Test App');
    
    // Vérifier l'aperçu
    await expect(page.getByText(/Aperçu/i)).toBeVisible();
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Test App');
  });

  test('save button is present and functional', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Vérifier le bouton sauvegarder
    const saveButton = page.getByRole('button', { name: /SAUVEGARDER/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // Cliquer sur sauvegarder
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Vérifier le message de succès
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('sauvegardés');
  });

  test('reset button restores defaults', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // Modifier le nom
    await page.getByPlaceholder(/Chibi Vulture/i).fill('Modified Name');

    // Cliquer sur réinitialiser
    const resetButton = page.getByRole('button', { name: /Réinitialiser/i });
    await expect(resetButton).toBeVisible();
    await resetButton.click();
    await page.waitForTimeout(1000);

    // Vérifier que le nom est réinitialisé
    const nameInput = page.getByPlaceholder(/Chibi Vulture/i);
    const value = await nameInput.inputValue();
    expect(value).toBe('Chibi Vulture');
  });

  test('character limits are enforced', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[role="tab"]').nth(6).click();
    await page.waitForLoadState('networkidle');

    // App name max 30 chars
    const nameInput = page.getByPlaceholder(/Chibi Vulture/i);
    await nameInput.fill('a'.repeat(31));
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeLessThanOrEqual(30);

    // Description max 50 chars
    const descInput = page.getByPlaceholder(/Le réseau social artistique/i);
    await descInput.fill('b'.repeat(51));
    const descValue = await descInput.inputValue();
    expect(descValue.length).toBeLessThanOrEqual(50);
  });
});
