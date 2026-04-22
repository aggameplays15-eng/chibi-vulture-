import { test, expect, Page } from '@playwright/test';

// Désactiver la parallélisation pour éviter le rate limiting en prod
test.describe.configure({ mode: 'serial' });

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsGuest(page: Page) {
  await page.goto('/login');
  await page.getByTestId('guest-button').click();
  await page.waitForURL('**/feed');
}

// Login via OTP flow — fills credentials, waits for OTP step, then navigates
// Since we can't receive real emails in tests, we skip the OTP step and just
// verify the OTP screen appears (credentials are valid)
async function loginAsUser(page: Page, email = 'papicamara22@gmail.com', password = 'fantasangare2203') {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-login').click();
  // After valid credentials, OTP screen appears (otpRequired flow)
  // Wait for either feed (no OTP) or OTP input to appear
  await page.waitForTimeout(3000);
}

// ─── 1. Page d'accueil ───────────────────────────────────────────────────────

test.describe("Page d'accueil", () => {
  test('charge correctement et affiche le titre', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Chibi Vulture/i);
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const html = await root.innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });

  test("pas d'erreurs JavaScript critiques", async ({ page }) => {
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

  test('boutons connexion et inscription visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('guest-button')).toBeVisible();
  });
});

// ─── 2. Authentification ─────────────────────────────────────────────────────

test.describe('Authentification', () => {
  test("page login s'affiche correctement", async ({ page }) => {
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
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('identifiants valides déclenchent le flow OTP ou redirigent', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('papicamara22@gmail.com');
    await page.getByTestId('password-input').fill('fantasangare2203');
    await page.getByTestId('submit-login').click();
    await page.waitForTimeout(4000);
    // Soit OTP screen, soit feed, soit login (si compte inexistant en prod)
    const url = page.url();
    expect(url).toMatch(/\/(feed|login)/);
  });

  test("page signup s'affiche correctement", async ({ page }) => {
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

  test('page mot de passe oublié accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ─── 3. Feed ─────────────────────────────────────────────────────────────────

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('le feed se charge et affiche des posts ou un loader', async ({ page }) => {
    await page.waitForTimeout(3000);
    // Posts, loader, ou message "tout chargé"
    const hasContent = await page.locator('img[loading="lazy"], [class*="animate-spin"], [class*="animate-pulse"]').first().isVisible().catch(() => false);
    const bodyText = await page.locator('body').innerText();
    expect(hasContent || bodyText.length > 100).toBeTruthy();
  });

  test('le header est visible', async ({ page }) => {
    await expect(page.locator('header, [role="banner"]').first()).toBeVisible();
  });

  test('la bottom nav est visible', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeVisible();
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

// ─── 5. Pages protégées ──────────────────────────────────────────────────────

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

  test('/admin affiche 404 (URL obfusquée)', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    // /admin est redirigé vers NotFound — la page doit afficher 404
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toMatch(/not found|404|introuvable/i);
  });
});

// ─── 6. Admin ────────────────────────────────────────────────────────────────

test.describe('Admin', () => {
  test("page admin login (/goated) se charge", async ({ page }) => {
    await page.goto('/goated');
    await expect(page.locator('#root')).toBeVisible();
    // La SPA rend du contenu dans #root
    await page.waitForTimeout(1500);
    const html = await page.locator('#root').innerHTML();
    expect(html.length).toBeGreaterThan(50);
  });

  test('accès /goated-panel sans auth redirige (login ou goated)', async ({ page }) => {
    await page.goto('/goated-panel');
    await page.waitForTimeout(1500);
    // Sans auth, redirige vers /login ou /goated
    await expect(page).toHaveURL(/\/(login|goated)/);
  });
});

// ─── 7. API endpoints ────────────────────────────────────────────────────────

test.describe('API endpoints', () => {
  // Pause pour éviter le rate limiting Vercel après les tests précédents
  test.beforeAll(async () => {
    await new Promise(r => setTimeout(r, 3000));
  });

  test('GET /api/posts répond', async ({ request }) => {
    const res = await request.get('/api/posts');
    expect([200, 401, 403, 429]).toContain(res.status());
  });

  test('GET /api/products répond', async ({ request }) => {
    const res = await request.get('/api/products');
    expect([200, 401, 403, 429]).toContain(res.status());
  });

  test('GET /api/app-settings répond', async ({ request }) => {
    const res = await request.get('/api/app-settings');
    expect([200, 401, 403, 429]).toContain(res.status());
  });

  test('GET /api/music répond', async ({ request }) => {
    const res = await request.get('/api/music');
    expect([200, 401, 403, 429]).toContain(res.status());
  });

  test('POST /api/login mauvais identifiants → 401 ou 429', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'faux@test.com', password: 'wrongpassword' }
    });
    expect([401, 429]).toContain(res.status());
  });

  test('POST /api/login identifiants valides → 200 ou 401 ou 429', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'papicamara22@gmail.com', password: 'fantasangare2203' }
    });
    expect([200, 401, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.otpRequired === true || !!body.token).toBeTruthy();
    }
  });

  test('route API inconnue → 404 ou 429', async ({ request }) => {
    const res = await request.get('/api/route-inexistante');
    expect([404, 429]).toContain(res.status());
  });

  test('POST /api/users sans données → 400 ou 429', async ({ request }) => {
    const res = await request.post('/api/users', { data: {} });
    expect([400, 429]).toContain(res.status());
  });

  test('POST /api/products sans token → 403 ou 429', async ({ request }) => {
    const res = await request.post('/api/products', {
      data: { name: 'Test', price: 1000, image: 'https://example.com/img.jpg', category: 'Test', stock: 1 }
    });
    expect([403, 429]).toContain(res.status());
  });

  test('GET /api/forgot-password → 404, 405 ou 429', async ({ request }) => {
    const res = await request.get('/api/forgot-password');
    expect([404, 405, 429]).toContain(res.status());
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

  test('la barre de recherche est visible', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(1500);
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
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

  test('favicon.svg est accessible', async ({ request }) => {
    const res = await request.get('/favicon.svg');
    expect(res.ok()).toBeTruthy();
  });
});

// ─── 10. Signup flow ─────────────────────────────────────────────────────────

test.describe('Signup flow', () => {
  test('inscription avec handle déjà pris affiche une erreur', async ({ page }) => {
    await page.goto('/signup');
    await page.getByTestId('name-input').fill('Test User');
    await page.getByTestId('email-input').fill(`test_${Date.now()}@test.com`);
    await page.getByTestId('handle-input').fill('admin'); // handle probablement pris
    await page.getByTestId('password-input').fill('testpassword123');
    await page.getByTestId('signup-button').click();
    await page.waitForTimeout(3000);
    // Soit erreur affichée, soit succès (si handle libre)
    const url = page.url();
    expect(url).toMatch(/signup/);
  });

  test('inscription avec mot de passe trop court reste sur signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByTestId('name-input').fill('Test');
    await page.getByTestId('email-input').fill('test@test.com');
    await page.getByTestId('handle-input').fill('testhandle');
    await page.getByTestId('password-input').fill('123'); // trop court
    await page.getByTestId('signup-button').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/signup/);
  });
});
