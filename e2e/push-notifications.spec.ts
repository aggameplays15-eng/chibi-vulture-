import { test, expect, Page } from '@playwright/test';

test.describe('Push Notifications - Admin', () => {
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
    // Mock API push stats
    await page.route('/api/admin-push-stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          stats: {
            totalSubscriptions: 25,
            uniqueUsers: 23,
            usersEnabled: 20,
            usersDisabled: 3,
          },
          recentSubscriptions: [
            { date: '2024-01-20', count: 5 },
            { date: '2024-01-19', count: 8 },
          ]
        })
      });
    });

    // Mock API send push notification
    await page.route('/api/admin-push-notify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sent: 20,
          failed: 2,
          cleaned: 1,
          total: 23,
          message: 'Notification sent to 20 users'
        })
      });
    });
  });

  test('admin can access push notifications tab', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click sur l'onglet notifications par son value
    const notificationsTab = page.locator('button[data-value="notifications"]');
    await expect(notificationsTab).toBeVisible();
    await notificationsTab.click();

    // Vérifier qu'on est sur l'onglet notifications
    await expect(page.getByText(/Statistiques Push/i)).toBeVisible();
  });

  test('push stats are displayed correctly', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Naviguer vers notifications
    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Vérifier les stats sont affichées
    await expect(page.getByText(/Abonnés/i)).toBeVisible();
    await expect(page.getByText(/Actifs/i)).toBeVisible();
    
    // Les nombres doivent être visibles (25 abonnés, 23 actifs)
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('25');
    expect(pageContent).toContain('23');
  });

  test('admin can send push notification', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Naviguer vers notifications
    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Remplir le formulaire
    await page.getByPlaceholder(/titre/i).fill('Nouvelle mise à jour !');
    await page.getByPlaceholder(/message/i).fill('Découvrez les nouvelles fonctionnalités');
    await page.getByPlaceholder(/url/i).fill('/feed');

    // Cliquer sur envoyer
    const sendButton = page.getByRole('button', { name: /ENVOYER/i });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Vérifier le succès
    await page.waitForTimeout(1000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('20'); // nombre d'envois réussis
  });

  test('send button disabled when form is empty', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Bouton désactivé par défaut
    const sendButton = page.getByRole('button', { name: /ENVOYER/i });
    await expect(sendButton).toBeDisabled();
  });

  test('character limits are enforced', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Title max 50 chars
    const titleInput = page.getByPlaceholder(/titre/i);
    await titleInput.fill('a'.repeat(51));
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeLessThanOrEqual(50);

    // Body max 150 chars
    const bodyInput = page.getByPlaceholder(/message/i);
    await bodyInput.fill('b'.repeat(151));
    const bodyValue = await bodyInput.inputValue();
    expect(bodyValue.length).toBeLessThanOrEqual(150);
  });

  test('notification preview updates in real-time', async ({ page }) => {
    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Remplir titre et message
    await page.getByPlaceholder(/titre/i).fill('Test Preview');
    await page.getByPlaceholder(/message/i).fill('Ceci est un aperçu');

    // Vérifier l'aperçu
    await expect(page.getByText(/Aperçu/i)).toBeVisible();
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Test Preview');
    expect(pageContent).toContain('Ceci est un aperçu');
  });

  test('VAPID not configured warning is shown', async ({ page }) => {
    // Override le mock pour retourner configured: false
    await page.route('/api/admin-push-stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: false,
          stats: { totalSubscriptions: 0, uniqueUsers: 0, usersEnabled: 0, usersDisabled: 0 },
          recentSubscriptions: []
        })
      });
    });

    await setupAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await page.locator('button[data-value="notifications"]').click();
    await page.waitForLoadState('networkidle');

    // Vérifier le warning
    await expect(page.getByText(/VAPID non configuré/i)).toBeVisible();
  });
});
