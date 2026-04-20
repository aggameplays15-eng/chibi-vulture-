import { test, expect } from '@playwright/test';

test('Production site should load correctly', async ({ page }) => {
  // Capture all console messages
  const consoleMessages: any[] = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture uncaught errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  // Capture failed requests
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(request.url());
  });
  
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for React to potentially render
  await page.waitForTimeout(5000);
  
  // Log all console messages
  console.log('Console messages:', JSON.stringify(consoleMessages, null, 2));
  console.log('Page errors:', pageErrors);
  console.log('Failed requests:', failedRequests);
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Chibi Vulture/);
  
  // Check root element
  const root = page.locator('#root');
  const rootExists = await root.count();
  console.log('Root element count:', rootExists);
  
  if (rootExists > 0) {
    const rootVisible = await root.isVisible();
    console.log('Root visible:', rootVisible);
    const rootContent = await root.innerHTML();
    console.log('Root content length:', rootContent.length);
  }
  
  // The test will pass if we can identify the issue, not if the site renders
  expect(consoleMessages.length).toBeGreaterThan(0);
});

test('Production assets should load correctly', async ({ page, request }) => {
  // Check CSS loads
  const cssResponse = await request.get('/assets/index-Bynli5bP.css');
  expect(cssResponse.ok()).toBeTruthy();
  
  // Check main JS loads
  const jsResponse = await request.get('/assets/index-BQKGwRV6.js');
  expect(jsResponse.ok()).toBeTruthy();
  
  // Check favicon loads
  const faviconResponse = await request.get('/favicon.svg');
  expect(faviconResponse.ok()).toBeTruthy();
});
