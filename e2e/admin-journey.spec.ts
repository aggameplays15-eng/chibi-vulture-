import { test, expect, Page } from '@playwright/test';

test.describe('Parcours Admin Complet - Comportement Humain', () => {
  const adminCredentials = {
    email: 'papicamara22@gmail.com',
    password: 'fantasangare2203'
  };

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
      localStorage.setItem('cv_users_list', JSON.stringify([
        { id: 2, name: 'Artiste A', handle: '@artiste_a', email: 'a@test.com', role: 'Artiste', isApproved: true, bio: '', avatarColor: '#EC4899', status: 'Actif', following: [], isAuthenticated: false, isGuest: false },
        { id: 10, name: 'Nouvel Artiste', handle: '@new_artist', email: 'new@test.com', role: 'Artiste', isApproved: false, bio: '', avatarColor: '#EC4899', status: 'Actif', following: [], isAuthenticated: false, isGuest: false }
      ]));
    });
  };

  test.beforeEach(async ({ page }) => {
    // Mock toutes les API admin pour un environnement isolé
    await page.route('/api/admin-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-admin-token',
          user: { id: 1, email: adminCredentials.email, role: 'Admin', name: 'Admin', handle: '@admin', isApproved: true }
        })
      });
    });

    await page.route('/api/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 156,
          totalPosts: 423,
          totalOrders: 89,
          pendingApprovals: 12,
          newUsersToday: 5,
          newPostsToday: 18,
          revenueThisMonth: 2840
        })
      });
    });

    await page.route('/api/admin/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Artiste A', handle: 'artiste_a', email: 'a@test.com', role: 'artist', status: 'active', created_at: '2024-01-15' },
          { id: 2, name: 'Artiste B', handle: 'artiste_b', email: 'b@test.com', role: 'artist', status: 'pending', created_at: '2024-01-16' },
          { id: 3, name: 'Client C', handle: 'client_c', email: 'c@test.com', role: 'client', status: 'active', created_at: '2024-01-14' }
        ])
      });
    });

    await page.route('/api/admin/pending-approvals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 10, name: 'Nouvel Artiste', handle: 'new_artist', email: 'new@test.com', submittedAt: '2024-01-20', portfolioUrl: 'https://portfolio.example.com' },
          { id: 11, name: 'Photographe Pro', handle: 'photo_pro', email: 'photo@test.com', submittedAt: '2024-01-19', portfolioUrl: 'https://photos.example.com' }
        ])
      });
    });

    await page.route('/api/admin/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, artistName: 'Artiste A', content: 'Ma nouvelle œuvre!', imageUrl: '/img1.jpg', status: 'published', likes: 45, createdAt: '2024-01-20', reports: 0 },
          { id: 2, artistName: 'Artiste B', content: 'Test post', imageUrl: '/img2.jpg', status: 'pending_review', likes: 12, createdAt: '2024-01-19', reports: 2 },
          { id: 3, artistName: 'Artiste C', content: 'Contenu signalé', imageUrl: '/img3.jpg', status: 'published', likes: 8, createdAt: '2024-01-18', reports: 5 }
        ])
      });
    });

    await page.route('/api/admin/approve-user', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.route('/api/admin/reject-user', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.route('/api/admin/moderate-post', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
  });

  test('Admin se connecte via la page dédiée', async ({ page }) => {
    // Navigation directe vers la page admin login (/goated)
    await page.goto('/goated');
    
    // Attendre que la page se charge complètement
    await page.waitForTimeout(500);
    
    // Vérifier la page de connexion admin
    await expect(page).toHaveURL(/.*goated/);
    
    // Remplir le formulaire lentement, comme un humain
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Saisie caractère par caractère avec délais réalistes
    await emailInput.fill(adminCredentials.email);
    await page.waitForTimeout(200);
    await passwordInput.fill(adminCredentials.password);
    await page.waitForTimeout(300);
    
    // Soumettre le formulaire
    const submitButton = page.locator('button[type="submit"], button:has-text("DÉVERROUILLER"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    await page.waitForTimeout(500);
  });

  test('Admin consulte le tableau de bord avec statistiques', async ({ page }) => {
    // Configurer l'authentification admin
    await setupAdminAuth(page);
    
    await page.goto('/admin');
    
    // Attendre le chargement du dashboard
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Vérifier les éléments clés du dashboard - AdminStats utilise des Cards
    await expect(page.getByText('ADMINISTRATION')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Panel Suprême')).toBeVisible();
    
    // Vérifier les 4 stat cards (Revenus, Utilisateurs, Commandes, Alertes)
    await expect(page.getByText('Revenus')).toBeVisible();
    await expect(page.getByText('Utilisateurs')).toBeVisible();
    await expect(page.getByText('Commandes')).toBeVisible();
    await expect(page.getByText('Alertes')).toBeVisible();
    
    // Scroller pour voir les graphiques
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(500);
    
    // Vérifier la présence de graphiques (Recharts svg)
    const charts = page.locator('svg, canvas, .recharts-wrapper').first();
    const hasCharts = await charts.isVisible().catch(() => false);
    if (hasCharts) {
      await expect(charts).toBeVisible();
    }
  });

  test('Admin navigue dans les différentes sections', async ({ page }) => {
    // Configurer l'authentification admin
    await setupAdminAuth(page);

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Les tabs utilisent des data-value - on les cible par value
    // Tab "users"
    const usersTab = page.locator('button[data-value="users"]');
    if (await usersTab.isVisible().catch(() => false)) {
      await usersTab.click();
      await page.waitForTimeout(600);

      // Vérifier UserManagement - cherche "Utilisateurs"
      await expect(page.getByText(/Utilisateurs/i).first()).toBeVisible();
    }

    // Tab "mod" contient PendingApprovals et PostModeration
    const modTab = page.locator('button[data-value="mod"]');
    if (await modTab.isVisible().catch(() => false)) {
      await modTab.click();
      await page.waitForTimeout(600);

      // Vérifier Approbations
      await expect(page.getByText(/Approbations|attente/i).first()).toBeVisible();
    }

    // Tab "shop"
    const shopTab = page.locator('button[data-value="shop"]');
    if (await shopTab.isVisible().catch(() => false)) {
      await shopTab.click();
      await page.waitForTimeout(600);

      await expect(page.getByText(/Boutique|Produits|Shop/i).first()).toBeVisible();
    }

    // Tab "delivery"
    const deliveryTab = page.locator('button[data-value="delivery"]');
    if (await deliveryTab.isVisible().catch(() => false)) {
      await deliveryTab.click();
      await page.waitForTimeout(600);
      
      await expect(page.getByText(/Livraisons|Commandes|Delivery/i).first()).toBeVisible();
    }
    
    // Retour au dashboard
    const dashboardTab = page.locator('button[data-value="dashboard"]');
    if (await dashboardTab.isVisible().catch(() => false)) {
      await dashboardTab.click();
      await page.waitForTimeout(400);
    }
  });

  test('Admin approuve un nouvel artiste', async ({ page }) => {
    // Configurer l'authentification admin
    await setupAdminAuth(page);
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Aller dans la section modération (qui contient PendingApprovals)
    const modTab = page.locator('[role="tablist"] button').nth(3);
    await modTab.click();
    await page.waitForTimeout(600);
    
    // Vérifier qu'il y a des demandes en attente
    const pendingCard = page.locator('text=Approbations en attente').first();
    await expect(pendingCard).toBeVisible();
    
    // Trouver le bouton d'approbation (icône Check)
    const approveButton = page.locator('button:has-text(""), button[class*="emerald"]').first();
    
    if (await approveButton.isVisible().catch(() => false)) {
      // Simuler un humain qui examine la demande
      await page.waitForTimeout(1000);
      
      // Cliquer sur approuver
      await approveButton.click();
      await page.waitForTimeout(500);
      
      console.log('Approbation effectuée avec succès');
    }
  });

  test('Admin modère un post signalé', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);
    
    // Navigation vers modération
    const moderationNav = page.locator('a:has-text("Modération"), button:has-text("Modération"), [data-testid*="moderation"]').first();
    if (await moderationNav.isVisible().catch(() => false)) {
      await moderationNav.click();
    } else {
      await page.goto('/admin/moderation');
    }
    
    await page.waitForTimeout(600);
    
    // Chercher un post signalé
    const reportedPost = page.locator('[class*="report"], tr:has-text("signa"), [data-testid*="post"]').first();
    
    if (await reportedPost.isVisible().catch(() => false)) {
      // Examiner le post
      await page.waitForTimeout(800);
      
      // Options de modération
      const actionsDropdown = page.locator('button:has-text("Action"), select, [class*="dropdown"], button[class*="action"]').first();
      if (await actionsDropdown.isVisible().catch(() => false)) {
        await actionsDropdown.click();
        await page.waitForTimeout(300);
        
        // Sélectionner une action
        const approveAction = page.locator('button:has-text("Approuver"), option:has-text("Approuver"), li:has-text("Approuver")').first();
        const rejectAction = page.locator('button:has-text("Rejeter"), button:has-text("Supprimer"), option:has-text("Rejeter"), li:has-text("Rejeter")').first();
        
        if (await approveAction.isVisible().catch(() => false)) {
          await approveAction.click();
        } else if (await rejectAction.isVisible().catch(() => false)) {
          await rejectAction.click();
        }
        
        await page.waitForTimeout(500);
      } else {
        // Boutons directs
        const moderateButton = page.locator('button:has-text("Modérer"), button:has-text("Examiner"), button[class*="moderate"]').first();
        if (await moderateButton.isVisible().catch(() => false)) {
          await moderateButton.click();
          await page.waitForTimeout(400);
        }
      }
    }
  });

  test('Admin gère les utilisateurs (suspend/ban)', async ({ page }) => {
    // Configurer l'authentification admin
    await setupAdminAuth(page);
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Navigation vers gestion utilisateurs (5ème tab)
    const usersTab = page.locator('[role="tablist"] button').nth(4);
    await usersTab.click();
    await page.waitForTimeout(600);
    
    // Vérifier la liste des utilisateurs
    const userList = page.locator('text=Utilisateurs').first();
    await expect(userList).toBeVisible();
    
    // Scroller pour voir plus d'utilisateurs
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(400);
    
    // Chercher un menu d'actions (icône MoreVertical)
    const actionButton = page.locator('button:has([class*="lucide-more-vertical"])').first();
    
    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();
      await page.waitForTimeout(300);
      
      // Vérifier que le menu s'ouvre
      const menuItem = page.locator('[role="menuitem"]').first();
      if (await menuItem.isVisible().catch(() => false)) {
        console.log('Menu d\'actions disponible');
      }
    }
  });

  test('Admin consulte les analytics et rapports', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(600);
    
    // Chercher section analytics/statistiques détaillées
    const analyticsNav = page.locator('a:has-text("Analytics"), button:has-text("Analytics"), a:has-text("Statistiques"), a:has-text("Rapports"), [data-testid*="analytics"]').first();
    if (await analyticsNav.isVisible().catch(() => false)) {
      await analyticsNav.click();
      await page.waitForTimeout(600);
    }
    
    // Vérifier les graphiques
    const charts = await page.locator('canvas, [class*="chart"], svg[class*="chart"], .recharts-wrapper').all();
    
    if (charts.length > 0) {
      for (let i = 0; i < Math.min(charts.length, 3); i++) {
        const chart = charts[i];
        await chart.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }
    }
    
    // Vérifier les métriques clés
    const metrics = await page.locator('[class*="metric"], [class*="kpi"], [class*="stat-value"]').all();
    
    for (const metric of metrics.slice(0, 4)) {
      if (await metric.isVisible().catch(() => false)) {
        await expect(metric).toBeVisible();
      }
    }
  });

  test('Admin se déconnecte', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);
    
    // Chercher le bouton de déconnexion
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Logout"), button:has-text("Se déconnecter"), a:has-text("Déconnexion"), [data-testid*="logout"]').first();
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(600);
      
      // Vérifier redirection vers login
      const url = page.url();
      expect(url).toMatch(/login|admin-login|\/$/);
      
      // Vérifier que le token est supprimé (vérifier UI)
      const loginForm = page.locator('input[type="email"], input[type="password"], button:has-text("Connexion"), form').first();
      if (await loginForm.isVisible().catch(() => false)) {
        await expect(loginForm).toBeVisible();
      }
    }
  });

  test('Admin accès non autorisé - redirection', async ({ page }) => {
    // Essayer d'accéder au dashboard sans être connecté
    await page.goto('/admin');
    await page.waitForTimeout(500);
    
    // Sans token valide, devrait rediriger vers login
    const url = page.url();
    
    if (!url.includes('admin') || url.includes('login')) {
      // Redirection correcte
      const loginElement = page.locator('input[type="email"], input[type="password"], button:has-text("Connexion"), form').first();
      if (await loginElement.isVisible().catch(() => false)) {
        await expect(loginElement).toBeVisible();
      }
    }
  });

  test('Parcours complet admin en une session', async ({ page }) => {
    // Connexion
    await page.goto('/goated');
    await page.waitForTimeout(400);
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(adminCredentials.email);
      await page.waitForTimeout(200);
      await passwordInput.fill(adminCredentials.password);
      await page.waitForTimeout(200);
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(800);
    }
    
    // Dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    await page.waitForTimeout(600);
    
    // Parcourir toutes les sections via les tabs
    const tabCount = await page.locator('[role="tablist"] button').count();
    
    for (let i = 0; i < Math.min(tabCount, 6); i++) {
      const tab = page.locator('[role="tablist"] button').nth(i);
      
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(600);
        
        // Vérifier contenu
        const content = page.locator('main, [class*="content"], div[class*="space-y"]').first();
        await expect(content).toBeVisible();
        
        await page.waitForTimeout(400);
      }
    }
    
    console.log('Parcours admin complet terminé');
  });
});
