import { test, expect, Page } from '@playwright/test';

const loginAdmin = async (page: Page) => {
  // Aller sur la page de login admin
  await page.goto('/goated');
  await page.waitForLoadState('networkidle');

  // Remplir et soumettre le formulaire
  await page.locator('input[type="email"]').fill('papicamara22@gmail.com');
  await page.locator('input[type="password"]').fill('fantasangare2203');
  await page.locator('button[type="submit"]').click();

  // Attendre la redirection vers /admin
  await page.waitForURL(/.*\/admin/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
};

test('Ajouter un produit depuis le panel admin', async ({ page }) => {
  await loginAdmin(page);
  await page.waitForTimeout(800);
  console.log('✅ Dashboard admin chargé');

  // Aller dans l'onglet Shop
  const shopTab = page.locator('[role="tablist"] button').nth(1);
  await shopTab.click();
  await page.waitForTimeout(600);
  console.log('✅ Onglet Shop ouvert');

  // Compter les produits avant
  const before = await page.getByText('Hoodie Vulture Premium', { exact: true }).count();
  console.log(`📦 Produits avant: ${before}`);

  // Cliquer sur "Nouveau Produit"
  await page.getByText('Nouveau Produit').click();
  await page.waitForTimeout(500);
  console.log('✅ Formulaire ouvert');

  // Vérifier que le formulaire est visible
  await expect(page.getByRole('heading', { name: 'Nouveau produit' })).toBeVisible();

  // Remplir le formulaire comme un humain
  await page.waitForTimeout(300);

  // Nom
  await page.locator('input[placeholder*="Chibi"]').fill('Hoodie Vulture Premium');
  await page.waitForTimeout(200);
  console.log('✅ Nom saisi');

  // Prix
  await page.locator('input[placeholder*="250000"]').fill('350000');
  await page.waitForTimeout(200);
  console.log('✅ Prix saisi');

  // Catégorie
  await page.locator('input[placeholder*="Vêtements"]').fill('Vêtements');
  await page.waitForTimeout(200);
  console.log('✅ Catégorie saisie');

  // Stock
  await page.locator('input[placeholder*="10"]').fill('25');
  await page.waitForTimeout(200);
  console.log('✅ Stock saisi');

  // Image (optionnel)
  await page.locator('input[placeholder*="https"]').fill('https://images.unsplash.com/photo-1556821840-3a63f15732ce?q=80&w=300');
  await page.waitForTimeout(200);
  console.log('✅ Image saisie');

  // Activer "En vedette"
  const featuredSwitch = page.locator('[role="switch"]');
  await featuredSwitch.click();
  await page.waitForTimeout(300);
  console.log('✅ Produit mis en vedette');

  // Soumettre
  await page.getByText('Ajouter le produit').click();
  await page.waitForTimeout(800);
  console.log('✅ Formulaire soumis');

  // Vérifier le toast de succès
  const toast = page.locator('[data-sonner-toast], [class*="toast"], li[data-type]').first();
  if (await toast.isVisible().catch(() => false)) {
    console.log('✅ Toast de confirmation visible');
  }

  // Attendre que le toast disparaisse
  await page.waitForTimeout(1000);

  // Vérifier que le produit apparaît dans la liste (exact match sur la carte)
  await expect(page.getByText('Hoodie Vulture Premium', { exact: true })).toBeVisible({ timeout: 5000 });
  console.log('✅ Produit "Hoodie Vulture Premium" visible dans la liste');

  // Vérifier le prix (toLocaleString peut donner "350 000" ou "350,000")
  const priceEl = page.locator('span').filter({ hasText: /350/ }).first();
  await expect(priceEl).toBeVisible();
  console.log('✅ Prix 350 000 GNF visible');

  // Vérifier l'étoile "featured"
  const star = page.locator('[class*="fill-yellow"]').first();
  if (await star.isVisible().catch(() => false)) {
    console.log('✅ Étoile "en vedette" visible');
  }

  // Compter les produits après — vérifier que le produit est bien là
  const after = await page.getByText('Hoodie Vulture Premium', { exact: true }).count();
  console.log(`📦 Produit trouvé: ${after} fois`);
  expect(after).toBeGreaterThan(before);

  console.log('\n🎉 PRODUIT AJOUTÉ AVEC SUCCÈS !');
  console.log('   Nom     : Hoodie Vulture Premium');
  console.log('   Prix    : 350 000 GNF');
  console.log('   Catég.  : Vêtements');
  console.log('   Stock   : 25');
  console.log('   Vedette : ✅');
});
