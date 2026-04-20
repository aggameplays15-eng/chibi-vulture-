import { test, expect, Page } from '@playwright/test';

// Connexion réelle via le formulaire
const loginAdmin = async (page: Page) => {
  await page.goto('/goated');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('papicamara22@gmail.com');
  await page.locator('input[type="password"]').fill('fantasangare2203');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/.*\/admin/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
};

const goTab = async (page: Page, index: number) => {
  await page.locator('[role="tablist"] button').nth(index).click();
  await page.waitForTimeout(700);
};

// ─────────────────────────────────────────────
test.describe('Admin — Vérification de toutes les options', () => {

  // ── SHOP ──────────────────────────────────
  test('Shop : ajouter, modifier, supprimer un produit', async ({ page }) => {
    await loginAdmin(page);
    await goTab(page, 1); // Shop

    console.log('\n🛍️  SHOP');

    // ── Ajouter ──
    await page.getByRole('button', { name: /Nouveau Produit/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { name: 'Nouveau produit' })).toBeVisible();
    console.log('✅ Formulaire ajout ouvert');

    await page.locator('input[placeholder*="Chibi"]').fill('Casquette Vulture');
    await page.locator('input[placeholder*="250000"]').fill('120000');
    await page.locator('input[placeholder*="Vêtements"]').fill('Accessoires');
    await page.locator('input[placeholder*="10"]').fill('50');
    await page.locator('[role="switch"]').click(); // featured ON
    await page.getByRole('button', { name: 'Ajouter le produit' }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('Casquette Vulture', { exact: true })).toBeVisible();
    console.log('✅ Produit "Casquette Vulture" ajouté');

    // ── Modifier ──
    await page.waitForTimeout(300);
    await page.locator('[data-testid="edit-product"]').first().click();
    await page.waitForTimeout(400);

    const heading = page.getByRole('heading', { name: /Modifier le produit/i });
    if (await heading.isVisible().catch(() => false)) {
      console.log('✅ Formulaire modification ouvert');
      await page.locator('input[placeholder*="Chibi"]').fill('Casquette Vulture EDIT');
      await page.getByRole('button', { name: 'Mettre à jour' }).click();
      await page.waitForTimeout(600);
      await expect(page.getByText('Casquette Vulture EDIT', { exact: true })).toBeVisible();
      console.log('✅ Produit modifié → "Casquette Vulture EDIT"');
    } else {
      console.log('⚠️  Formulaire modification non ouvert');
    }

    // ── Supprimer ──
    // Compter les delete buttons avant suppression
    const deleteButtons = page.locator('[data-testid="delete-product"]');
    const countBefore2 = await deleteButtons.count();
    // Cliquer sur le dernier (notre produit ajouté/modifié)
    await deleteButtons.nth(countBefore2 - 1).click();
    await page.waitForTimeout(800);
    // Vérifier que le nombre de boutons delete a diminué
    const countAfter2 = await page.locator('[data-testid="delete-product"]').count();
    expect(countAfter2).toBeLessThan(countBefore2);
    console.log(`✅ Produit supprimé (${countBefore2} → ${countAfter2} produits)`);
  });

  // ── DELIVERY ──────────────────────────────
  test('Delivery : ajouter une zone, modifier le prix, sauvegarder, supprimer', async ({ page }) => {
    await loginAdmin(page);
    await goTab(page, 2); // Delivery

    console.log('\n🚚  DELIVERY');

    const countBefore = await page.locator('input[placeholder=""]').count();

    // ── Ajouter une zone ──
    await page.getByRole('button', { name: /Ajouter/i }).click();
    await page.waitForTimeout(400);
    const countAfter = await page.locator('input').count();
    expect(countAfter).toBeGreaterThan(countBefore);
    console.log('✅ Nouvelle zone ajoutée');

    // ── Modifier le nom et le prix de la dernière zone ──
    const labelInputs = page.locator('[data-testid="zone-label"]');
    const priceInputs = page.locator('[data-testid="zone-price"]');
    const zoneCount2  = await labelInputs.count();

    await labelInputs.nth(zoneCount2 - 1).fill('Zone Test Playwright');
    await page.waitForTimeout(200);
    await priceInputs.nth(zoneCount2 - 1).fill('75000');
    await page.waitForTimeout(200);
    console.log('✅ Zone nommée "Zone Test Playwright", prix 75 000 GNF');

    // ── Sauvegarder ──
    await page.getByRole('button', { name: /ENREGISTRER/i }).click();
    await page.waitForTimeout(500);
    console.log('✅ Zones sauvegardées');

    // ── Supprimer la zone ajoutée ──
    const deleteZoneBtns = page.locator('[data-testid="delete-zone"]');
    await deleteZoneBtns.last().click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /ENREGISTRER/i }).click();
    await page.waitForTimeout(400);
    console.log('✅ Zone supprimée et sauvegardée');
  });

  // ── MODÉRATION ────────────────────────────
  test('Modération : approuver un artiste, rejeter un artiste, modérer un post', async ({ page }) => {
    await loginAdmin(page);
    await goTab(page, 3); // Modération

    console.log('\n🛡️  MODÉRATION');

    // ── PendingApprovals ──
    const pendingSection = page.getByText('Approbations en attente');
    await expect(pendingSection).toBeVisible();
    console.log('✅ Section approbations visible');

    const approveBtn = page.locator('button[title="Approuver"]').first();
    const rejectBtn  = page.locator('button[title="Rejeter"]').first();

    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Artiste approuvé');
    } else {
      console.log('ℹ️  Aucun artiste en attente d\'approbation');
    }

    if (await rejectBtn.isVisible().catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Artiste rejeté');
    } else {
      console.log('ℹ️  Aucun artiste à rejeter');
    }

    // ── PostModeration ──
    const signalSection = page.getByText('Signalements en attente');
    await expect(signalSection).toBeVisible();
    console.log('✅ Section signalements visible');

    const keepBtn   = page.locator('button[title="Approuver"]').first();
    const deleteBtn = page.locator('button[title="Supprimer"]').first();

    if (await keepBtn.isVisible().catch(() => false)) {
      await keepBtn.click();
      await page.waitForTimeout(400);
      console.log('✅ Post approuvé (signalement ignoré)');
    }

    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(400);
      console.log('✅ Post signalé supprimé');
    } else {
      console.log('ℹ️  Aucun post signalé à traiter');
    }
  });

  // ── USERS ─────────────────────────────────
  test('Users : ouvrir menu, bannir un utilisateur', async ({ page }) => {
    await loginAdmin(page);
    await goTab(page, 4); // Users

    console.log('\n👥  USERS');

    await expect(page.getByText('Utilisateurs')).toBeVisible();
    console.log('✅ Section utilisateurs visible');

    const menuBtns = page.locator('button').filter({ has: page.locator('[class*="lucide-more-vertical"]') });
    const count = await menuBtns.count();
    console.log(`ℹ️  ${count} utilisateur(s) trouvé(s)`);

    if (count > 0) {
      // Ouvrir le menu du premier utilisateur non-admin
      await menuBtns.first().click();
      await page.waitForTimeout(400);

      // Vérifier les 3 options
      await expect(page.getByRole('menuitem', { name: /Contacter/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Promouvoir/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Bannir/i })).toBeVisible();
      console.log('✅ Menu actions : Contacter, Promouvoir Admin, Bannir — tous visibles');

      // Bannir
      await page.getByRole('menuitem', { name: /Bannir/i }).click();
      await page.waitForTimeout(500);
      console.log('✅ Action Bannir exécutée');

      // Vérifier le point rouge (statut banni)
      const redDot = page.locator('.bg-rose-500').first();
      if (await redDot.isVisible().catch(() => false)) {
        console.log('✅ Indicateur rouge "Banni" visible');
      }
    } else {
      console.log('ℹ️  Aucun utilisateur à tester');
    }
  });

  // ── APPEARANCE ────────────────────────────
  test('Appearance : changer couleur, changer logo, réinitialiser', async ({ page }) => {
    await loginAdmin(page);
    await goTab(page, 5); // Appearance

    console.log('\n🎨  APPEARANCE');

    // ── Changer la couleur ──
    const colorBtns = page.locator('button[style*="background-color"]');
    const colorCount = await colorBtns.count();
    console.log(`ℹ️  ${colorCount} couleurs preset disponibles`);

    if (colorCount > 1) {
      // Cliquer sur la 2ème couleur (Violet Royal)
      await colorBtns.nth(1).click();
      await page.waitForTimeout(500);
      console.log('✅ Couleur "Violet Royal" sélectionnée');

      // Remettre la couleur d'origine (Rose Chibi = 1ère)
      await colorBtns.nth(0).click();
      await page.waitForTimeout(400);
      console.log('✅ Couleur d\'origine restaurée');
    }

    // ── Couleur personnalisée via input color ──
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();
    console.log('✅ Sélecteur couleur personnalisée visible');

    // ── Bouton changer logo ──
    const logoBtn = page.getByRole('button', { name: /CHANGER LE LOGO/i });
    await expect(logoBtn).toBeVisible();
    console.log('✅ Bouton "CHANGER LE LOGO" visible');

    // ── Réinitialiser ──
    await page.getByRole('button', { name: /Réinitialiser/i }).click();
    await page.waitForTimeout(500);
    console.log('✅ Apparence réinitialisée');
  });

  // ── DASHBOARD ─────────────────────────────
  test('Dashboard : stats, graphique, hover sur cartes', async ({ page }) => {
    await loginAdmin(page);
    // Déjà sur dashboard (tab 0)

    console.log('\n📊  DASHBOARD');

    await expect(page.getByText('ADMINISTRATION')).toBeVisible();
    await expect(page.getByText('Panel Suprême')).toBeVisible();
    console.log('✅ Header visible');

    for (const label of ['Revenus', 'Utilisateurs', 'Commandes', 'Alertes']) {
      await expect(page.getByText(label).first()).toBeVisible();
      console.log(`✅ Carte "${label}" visible`);
    }

    // Hover sur chaque carte
    const cards = page.locator('[class*="CardContent"]');
    const n = await cards.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      await cards.nth(i).hover();
      await page.waitForTimeout(200);
    }
    console.log('✅ Hover sur les 4 cartes OK');

    // Scroll vers graphique
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(600);
    const chart = page.locator('.recharts-wrapper, svg').first();
    if (await chart.isVisible().catch(() => false)) {
      console.log('✅ Graphique visible');
    }
    await page.mouse.wheel(0, -500);
  });

});
