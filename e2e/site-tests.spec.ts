import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsGuest(page: Page) {
  await page.goto('/login');
  await page.getByTestId('guest-button').click();
  await page.waitForURL('**/feed');
}

async function loginAsUser(page: Page, email = 'papicamara22@gmail.com', password = 'fantasangare2203') {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-login').click();
  await page.waitForURL('**/feed', { timeout: 10000 });
}

// ─── 1. Page d'accueil ───────────────────────────────────────────────────────

test.describe('Page d\'accueil', () => {
  test('charge correctement et affiche le titre', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Chibi Vulture/i);
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const html = await root.innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });

  test('pas d\'erreurs JavaScript critiques', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('les assets (JS, CSS, favicon) se chargent', async ({ page, request }) => {
    await page.goto('/');
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'))
    );
    expect(scripts.length).toBeGreaterThan(0);

    const faviconRes = await request.get('/favicon.svg');
    expect(faviconRes.ok()).toBeTruthy();
  });
});

// ─── 2. Authentification ─────────────────────────────────────────────────────

test.describe('Authentification', () => {
  test('page login s\'affiche correctement', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-login')).toBeVisible();
    await expect(page.getByTestId('guest-button')).toBeVisible();
  });

  test('connexion en mode invité redirige vers le feed', async ({ page }) => {
    await loginAsGuest(page);
    await expect(page).toHaveURL(/\/feed/);
  });

  test('connexion avec mauvais identifiants affiche une erreur', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('faux@email.com');
    await page.getByTestId('password-input').fill('mauvaismdp');
    await page.getByTestId('submit-login').click();
    // Attendre un toast d'erreur ou un message
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('connexion admin redirige vers le feed', async ({ page }) => {
    await loginAsUser(page);
    await expect(page).toHaveURL(/\/feed/);
  });

  test('page signup s\'affiche correctement', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('handle-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('signup-button')).toBeVisible();
  });

  test('lien vers signup depuis login fonctionne', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /s'inscrire/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('lien vers login depuis signup fonctionne', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 3. Feed ─────────────────────────────────────────────────────────────────

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('le feed se charge et affiche des posts', async ({ page }) => {
    await page.waitForTimeout(3000);
    // Au moins un post ou le loader doit être visible
    const posts = page.locator('.rounded-\\[40px\\]');
    const loader = page.locator('[class*="animate-spin"]');
    const count = await posts.count();
    const loaderVisible = await loader.isVisible().catch(() => false);
    expect(count > 0 || loaderVisible).toBeTruthy();
  });

  test('le bouton notifications est visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible();
  });

  test('cliquer sur notifications redirige', async ({ page }) => {
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page).toHaveURL(/\/notifications/);
  });
});

// ─── 4. Navigation principale ────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('navigation vers /explore fonctionne', async ({ page }) => {
    await page.goto('/explore');
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('navigation vers /shop fonctionne', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveURL(/\/shop/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('navigation vers /cart fonctionne', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('navigation vers /support fonctionne', async ({ page }) => {
    await page.goto('/support');
    await expect(page).toHaveURL(/\/support/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('navigation vers /terms fonctionne', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('route inconnue affiche la page 404', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas');
    await expect(page.locator('#root')).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toMatch(/not found|404|introuvable/i);
  });
});

// ─── 5. Pages protégées (invité redirigé) ────────────────────────────────────

test.describe('Protection des routes', () => {
  test('accès /profile sans auth redirige vers /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('accès /messages sans auth redirige vers /login', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/login/);
  });

  test('accès /settings sans auth redirige vers /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('accès /admin sans auth redirige', async ({ page }) => {
    await page.goto('/admin');
    // Doit rediriger (pas rester sur /admin)
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});

// ─── 6. Admin ────────────────────────────────────────────────────────────────

test.describe('Admin', () => {
  test('page admin login (/goated) s\'affiche', async ({ page }) => {
    await page.goto('/goated');
    await expect(page.locator('#root')).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(0);
  });

  test('connexion admin donne accès au dashboard', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('#root')).toBeVisible();
  });
});

// ─── 7. API endpoints ────────────────────────────────────────────────────────

test.describe('API endpoints', () => {
  test('GET /api/posts répond avec succès', async ({ request }) => {
    const res = await request.get('/api/posts');
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/products répond avec succès', async ({ request }) => {
    const res = await request.get('/api/products');
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/app-settings répond', async ({ request }) => {
    const res = await request.get('/api/app-settings');
    expect([200, 401, 403]).toContain(res.status());
  });

  test('GET /api/music répond', async ({ request }) => {
    const res = await request.get('/api/music');
    expect([200, 401]).toContain(res.status());
  });

  test('POST /api/login avec mauvais identifiants retourne 401', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'faux@test.com', password: 'wrongpassword' }
    });
    expect(res.status()).toBe(401);
  });

  test('route API inconnue retourne 404', async ({ request }) => {
    const res = await request.get('/api/route-inexistante');
    expect(res.status()).toBe(404);
  });
});

// ─── 8. Shop ─────────────────────────────────────────────────────────────────

test.describe('Shop', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('la page shop se charge', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(2000);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('la page cart se charge', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('#root')).toBeVisible();
  });
});

// ─── 9. Pages statiques ──────────────────────────────────────────────────────

test.describe('Pages statiques', () => {
  test('manifest.json est accessible', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
  });

  test('robots.txt est accessible', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
  });

  test('service worker sw.js est accessible', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
  });
});
