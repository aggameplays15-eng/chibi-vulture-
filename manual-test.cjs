const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('🧪 TEST MANUEL - Mode Guest');
  
  // 1. Landing page
  console.log('1️⃣ Test Landing Page...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/01-landing.png' });
  
  // Vérifier éléments
  const logo = await page.locator('img[alt*="Logo"]').first();
  const loginBtn = await page.getByTestId('login-button');
  const guestBtn = await page.getByTestId('guest-button');
  
  console.log('   ✓ Logo visible:', await logo.isVisible());
  console.log('   ✓ Bouton login visible:', await loginBtn.isVisible());
  console.log('   ✓ Bouton guest visible:', await guestBtn.isVisible());
  
  // 2. Mode Guest - Feed
  console.log('2️⃣ Test Mode Guest - Feed...');
  await guestBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/02-feed-guest.png' });
  
  const url = page.url();
  console.log('   ✓ URL:', url);
  console.log('   ✓ Contient /feed:', url.includes('feed'));
  
  // 3. Navigation Shop
  console.log('3️⃣ Test Navigation Shop...');
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/03-shop.png' });
  
  const shopUrl = page.url();
  console.log('   ✓ URL Shop:', shopUrl);
  
  // Compter produits
  const products = await page.locator('img').count();
  console.log('   ✓ Nombre d\'images/produits:', products);
  
  // 4. Navigation Cart
  console.log('4️⃣ Test Cart...');
  await page.goto('http://localhost:5173/cart');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/04-cart.png' });
  console.log('   ✓ URL Cart:', page.url());
  
  // 5. Test Login Page
  console.log('5️⃣ Test Page Login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/05-login.png' });
  
  const emailInput = await page.getByTestId('email-input');
  const passwordInput = await page.getByTestId('password-input');
  const submitBtn = await page.getByTestId('submit-login');
  
  console.log('   ✓ Input email visible:', await emailInput.isVisible());
  console.log('   ✓ Input password visible:', await passwordInput.isVisible());
  console.log('   ✓ Bouton submit visible:', await submitBtn.isVisible());
  
  // 6. Test Signup
  console.log('6️⃣ Test Page Signup...');
  await page.goto('http://localhost:5173/signup');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/06-signup.png' });
  
  const nameInput = await page.getByTestId('name-input');
  const handleInput = await page.getByTestId('handle-input');
  const signupBtn = await page.getByTestId('signup-button');
  
  console.log('   ✓ Input nom visible:', await nameInput.isVisible());
  console.log('   ✓ Input handle visible:', await handleInput.isVisible());
  console.log('   ✓ Bouton signup visible:', await signupBtn.isVisible());
  
  // 7. Test création compte
  console.log('7️⃣ Test Création Compte...');
  
  // Mock API
  await page.route('/api/users', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 999, name: 'TestUser', email: 'test@test.com', handle: '@testuser' })
    });
  });
  
  await nameInput.fill('Test Utilisateur');
  await page.getByTestId('email-input').fill('test@utilisateur.com');
  await handleInput.fill('@testutilisateur');
  await page.getByTestId('password-input').fill('Test123!');
  
  await page.screenshot({ path: 'test-results/07-signup-filled.png' });
  
  await signupBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/08-signup-success.png' });
  
  const patienceMsg = await page.getByTestId('patience-message');
  console.log('   ✓ Message PATIENCE visible:', await patienceMsg.isVisible().catch(() => false));
  
  // 8. Test Profil Guest
  console.log('8️⃣ Test Profil Guest...');
  await page.goto('http://localhost:5173/login');
  await page.getByTestId('guest-button').click();
  await page.waitForTimeout(2000);
  
  // Naviguer vers profil via bottom nav
  await page.getByRole('link', { name: /Profil/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/09-profile.png' });
  
  console.log('   ✓ URL Profil:', page.url());
  
  console.log('\n✅ TOUS LES TESTS MANUELS TERMINÉS!');
  console.log('Screenshots sauvegardés dans test-results/');
  
  await browser.close();
})();
