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
  
  // Wait for React to render
  await page.waitForTimeout(5000);
  
  // Log all console messages
  console.log('Console messages:', JSON.stringify(consoleMessages, null, 2));
  console.log('Page errors:', pageErrors);
  console.log('Failed requests:', failedRequests);
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Chibi Vulture/);
  
  // Check that there are no page errors
  expect(pageErrors).toHaveLength(0);
  
  // Check root element has content
  const root = page.locator('#root');
  await expect(root).toBeVisible();
  
  const rootContent = await root.innerHTML();
  expect(rootContent.length).toBeGreaterThan(0);
});

test('Production assets should load correctly', async ({ page, request }) => {
  await page.goto('/');
  
  // Get all loaded scripts from the page
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  });
  
  // Check that at least one script loaded
  expect(scripts.length).toBeGreaterThan(0);
  
  // Check that main JS loads (first script should be the main entry)
  const mainJsUrl = scripts.find(s => s.includes('/assets/index-'));
  expect(mainJsUrl).toBeDefined();
  
  const jsResponse = await request.get(mainJsUrl!);
  expect(jsResponse.ok()).toBeTruthy();
  
  // Check CSS loads
  const stylesheets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
  });
  
  expect(stylesheets.length).toBeGreaterThan(0);
  
  // Check favicon loads
  const faviconResponse = await request.get('/favicon.svg');
  expect(faviconResponse.ok()).toBeTruthy();
});
