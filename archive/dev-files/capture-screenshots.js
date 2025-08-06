const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const pages = [
    { url: 'http://localhost:3003', name: '01-homepage' },
    { url: 'http://localhost:3003/login', name: '02-login' },
    { url: 'http://localhost:3003/onboarding/create-child', name: '03-create-child' },
    { url: 'http://localhost:3003/dashboard', name: '04-dashboard' },
    { url: 'http://localhost:3003/create-book/universe', name: '05-universe-selection' },
    { url: 'http://localhost:3003/create-book/character', name: '06-character-selection' },
    { url: 'http://localhost:3003/create-book/spark', name: '07-spark-selection' },
    { url: 'http://localhost:3003/book/1/chapter/1', name: '08-reading-interface' }
  ];

  // Create screenshots directory
  const fs = require('fs');
  const path = require('path');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  for (const pageInfo of pages) {
    try {
      console.log(`Capturing ${pageInfo.name}...`);
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      
      // Wait a bit for any animations to complete
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `${pageInfo.name}.png`),
        fullPage: true 
      });
      console.log(`✓ Captured ${pageInfo.name}`);
    } catch (error) {
      console.error(`✗ Failed to capture ${pageInfo.name}: ${error.message}`);
    }
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

captureScreenshots().catch(console.error);