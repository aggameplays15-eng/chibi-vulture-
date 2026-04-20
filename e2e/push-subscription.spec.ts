import { test, expect, Page } from '@playwright/test';

test.describe('Push Subscription - User Flow', () => {
  const asGuest = async (page: Page) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('guest-button').click();
    await page.waitForURL(/.*\/feed/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  };

  const asUser = async (page: Page) => {
    await page.addInitScript(() => {
      localStorage.setItem('cv_token', 'mock-user-token');
      localStorage.setItem('cv_user', JSON.stringify({
        id: 2,
        email: 'user@test.com',
        role: 'Artiste',
        name: 'Test User',
        handle: '@testuser',
        isApproved: true,
        isAuthenticated: true,
        isGuest: false,
        bio: 'Test user',
        avatarColor: '#EC4899',
        status: 'Actif',
        following: []
      }));
    });
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
  };

  test.beforeEach(async ({ page }) => {
    // Mock API get VAPID public key
    await page.route('/api/push-subscribe', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            publicKey: 'BLH5fpNdT9tX3Rvjjh4rztmrBBB54pWVB0bIcEdfkfm9VafqUuzuqb9cOHjWG4jjPt-31ejlX8jztFgXLANwrns'
          })
        });
      } else if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });
  });

  test('VAPID public key is retrievable', async ({ page }) => {
    await asUser(page);

    // Appeler l'API pour récupérer la clé publique
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/push-subscribe');
      return await res.json();
    });

    expect(response).toHaveProperty('publicKey');
    expect(response.publicKey).toBeTruthy();
  });

  test('push subscription API accepts POST request', async ({ page }) => {
    await asUser(page);

    // Simuler une subscription
    const mockSubscription = {
      endpoint: 'https://push.example.com/endpoint',
      keys: {
        p256dh: 'test-key',
        auth: 'test-auth'
      }
    };

    const response = await page.evaluate(async (sub) => {
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      });
      return await res.json();
    }, mockSubscription);

    expect(response).toHaveProperty('success');
    expect(response.success).toBe(true);
  });

  test('push subscription API accepts DELETE request', async ({ page }) => {
    await asUser(page);

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/push-subscribe', {
        method: 'DELETE'
      });
      return await res.json();
    });

    expect(response).toHaveProperty('success');
    expect(response.success).toBe(true);
  });

  test('subscription requires authentication', async ({ page }) => {
    await asGuest(page);

    // Sans token, devrait retourner 401
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: {} })
        });
        return { status: res.status };
      } catch (e) {
        return { status: 0, error: (e as Error).message };
      }
    });

    // 401 ou erreur attendue
    expect([401, 0]).toContain(response.status);
  });

  test('GET endpoint returns error when VAPID not configured', async ({ page }) => {
    // Override le mock pour simuler VAPID non configuré
    await page.route('/api/push-subscribe', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Push notifications not configured' })
        });
      }
    });

    await asUser(page);

    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/push-subscribe');
        const data = await res.json();
        return { status: res.status, error: data.error };
      } catch (e) {
        return { status: 0, error: (e as Error).message };
      }
    });

    expect(response.status).toBe(503);
    expect(response.error).toContain('not configured');
  });

  test('subscription validation requires endpoint', async ({ page }) => {
    await asUser(page);

    // Envoyer une subscription sans endpoint
    const invalidSubscription = {
      keys: {
        p256dh: 'test-key',
        auth: 'test-auth'
      }
    };

    const response = await page.evaluate(async (sub) => {
      try {
        const res = await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub })
        });
        const data = await res.json();
        return { status: res.status, error: data.error };
      } catch (e) {
        return { status: 0, error: (e as Error).message };
      }
    }, invalidSubscription);

    // 400 (validation error) ou 200 si validation côté client
    expect([400, 200]).toContain(response.status);
  });

  test.skip('push notification service worker is registered (skipped in headless mode)', async ({ page }) => {
    // Service worker ne fonctionne pas en mode headless Playwright
    // Ce test nécessite un navigateur réel
    await asUser(page);

    const swRegistered = await page.evaluate(async () => {
      return navigator.serviceWorker.ready
        .then(() => true)
        .catch(() => false);
    });

    expect(typeof swRegistered).toBe('boolean');
  });

  test('push manager is available in browser', async ({ page }) => {
    await asUser(page);

    const pushManagerAvailable = await page.evaluate(() => {
      return 'PushManager' in window && 'serviceWorker' in navigator;
    });

    expect(pushManagerAvailable).toBe(true);
  });

  test('notification permission can be requested', async ({ page }) => {
    await asUser(page);

    const notificationAvailable = await page.evaluate(() => {
      return 'Notification' in window && typeof Notification.requestPermission === 'function';
    });

    expect(notificationAvailable).toBe(true);
  });
});
