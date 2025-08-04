// Simple Page Image Extractor for TeachTales
// Run this on each page to extract all visible image URLs

function extractPageImages(pageName = '') {
  const images = new Set();
  const timestamp = new Date().toISOString();
  
  // Extract from img elements
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.startsWith('http')) {
      images.add(JSON.stringify({
        url: img.src,
        alt: img.alt || '',
        type: 'img-src',
        page: pageName,
        timestamp: timestamp
      }));
    }
    if (img.dataset.src && img.dataset.src.startsWith('http')) {
      images.add(JSON.stringify({
        url: img.dataset.src,
        alt: img.alt || '',
        type: 'img-data-src', 
        page: pageName,
        timestamp: timestamp
      }));
    }
  });
  
  // Extract from CSS background images
  document.querySelectorAll('*').forEach(element => {
    const bgImage = window.getComputedStyle(element).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const matches = bgImage.match(/url\(["']?([^"')]+)["']?\)/g);
      if (matches) {
        matches.forEach(match => {
          const url = match.replace(/url\(["']?([^"')]+)["']?\)/, '$1');
          if (url.startsWith('http')) {
            images.add(JSON.stringify({
              url: url,
              alt: '',
              type: 'css-background',
              page: pageName,
              timestamp: timestamp
            }));
          }
        });
      }
    }
  });
  
  const results = Array.from(images).map(img => JSON.parse(img));
  console.log(`Found ${results.length} images on page: ${pageName}`);
  return results;
}

// Usage: extractPageImages('page-name-here')
