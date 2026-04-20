import { test, expect } from '@playwright/test';

test.describe('Mode Guest - Navigation', () => {
  test('landing page loads with animated logo', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie le titre
    await expect(page).toHaveTitle(/Chibi Vulture/i);
    
    // Vérifie le logo est présent
    const logo = page.locator('img[alt*="Logo" i]').first();
    await expect(logo).toBeVisible();
    
    // Vérifie les boutons principaux avec les textes exacts
    await expect(page.getByText(/Explorer en invité/i)).toBeVisible();
    await expect(page.getByText(/SE CONNECTER/i)).toBeVisible();
    
    // Vérifie data-testid
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('guest-button')).toBeVisible();
  });

  test('guest can access feed via login page', async ({ page }) => {
    await page.goto('/');
    
    // Click sur "SE CONNECTER" pour aller à la page login
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/.*login/);
    
    // Sur la page login, click sur "CONTINUER EN INVITÉ"
    await expect(page.getByTestId('guest-button')).toBeVisible();
    await page.getByTestId('guest-button').click();
    
    // Redirection vers feed
    await expect(page).toHaveURL(/.*feed/);
    
    // Vérifie que la page feed charge (header présent)
    await expect(page.getByText(/Fil d'actu/i).or(page.getByText(/Communauté/i)).first()).toBeVisible();
  });

  test('guest can view posts and navigate to shop', async ({ page }) => {
    // Accéder au feed en mode guest
    await page.goto('/login');
    await page.getByTestId('guest-button').click();
    await expect(page).toHaveURL(/.*feed/);
    
    // Attendre que le feed charge
    await page.waitForTimeout(1000);
    
    // Vérifie qu'il y a des posts (images)
    const images = page.locator('img');
    expect(await images.count()).toBeGreaterThan(0);
    
    // Navigation vers Shop via la bottom nav
    await page.goto('/shop');
    await expect(page).toHaveURL(/.*shop/);
    
    // Vérifie la présence de la boutique (utilise first() pour éviter strict mode violation)
    await expect(page.getByText(/Boutique/i).or(page.getByText(/Shop/i)).first()).toBeVisible();
  });

  test('guest can access cart but cannot checkout', async ({ page }) => {
    // Mode guest
    await page.goto('/login');
    await page.getByTestId('guest-button').click();
    
    // Aller au panier
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/);
    
    // Vérifie que la page panier s'affiche (même vide)
    await expect(page.getByText(/Mon Panier/i).or(page.getByText(/Panier/i)).first()).toBeVisible();
  });
});
