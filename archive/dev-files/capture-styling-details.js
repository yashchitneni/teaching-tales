const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://localhost:3003...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
    
    // Capture color palette by focusing on different sections
    console.log('Capturing color palette and styling details...');
    
    // 1. Typography samples
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      await page.screenshot({ 
        path: 'screenshots/typography-samples.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 800 }
      });
    }
    
    // 2. Background colors and gradients
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        * { 
          transition: none !important; 
          animation: none !important; 
        }
      `;
      document.head.appendChild(style);
    });
    
    await page.screenshot({ 
      path: 'screenshots/background-colors.png',
      fullPage: false 
    });
    
    // 3. Mobile responsive view
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ 
      path: 'screenshots/mobile-view.png',
      fullPage: false 
    });
    
    // 4. Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: 'screenshots/tablet-view.png',
      fullPage: false 
    });
    
    // 5. Get computed styles for documentation
    const styles = await page.evaluate(() => {
      const elements = {
        body: document.body,
        nav: document.querySelector('nav') || document.querySelector('header'),
        buttons: document.querySelector('button') || document.querySelector('a[class*="btn"]'),
        headings: document.querySelector('h1') || document.querySelector('h2'),
        text: document.querySelector('p')
      };
      
      const getComputedStyles = (el) => {
        if (!el) return null;
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          padding: computed.padding,
          margin: computed.margin,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow
        };
      };
      
      const result = {};
      for (const [key, el] of Object.entries(elements)) {
        result[key] = getComputedStyles(el);
      }
      return result;
    });
    
    // Save styles information
    const fs = require('fs');
    fs.writeFileSync('screenshots/computed-styles.json', JSON.stringify(styles, null, 2));
    console.log('Saved computed styles to computed-styles.json');
    
    console.log('All styling screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error capturing styling screenshots:', error);
  } finally {
    await browser.close();
  }
})();