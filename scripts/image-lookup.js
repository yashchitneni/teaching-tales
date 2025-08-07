#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Image lookup and identification helper

function loadImageData() {
  const files = [
    'phase1-generated-images.json',
    'phase2-uploaded-images.json', 
    'complete-image-list.json'
  ];
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  
  console.error('❌ No image data files found');
  process.exit(1);
}

function searchImages(query) {
  const data = loadImageData();
  const allImages = Array.isArray(data) ? data : Object.values(data).flat();
  
  const results = allImages.filter(img => {
    const searchText = `${img.name} ${img.category} ${img.universe || ''} ${img.filename || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
  
  return results;
}

function listByCategory() {
  const data = loadImageData();
  const allImages = Array.isArray(data) ? data : Object.values(data).flat();
  
  const byCategory = allImages.reduce((groups, img) => {
    const category = img.category || 'unknown';
    if (!groups[category]) groups[category] = [];
    groups[category].push(img);
    return groups;
  }, {});
  
  Object.entries(byCategory).forEach(([category, images]) => {
    console.log(`\n📂 ${category.toUpperCase()} (${images.length} images):`);
    images.forEach(img => {
      const status = img.approved ? '✅' : img.regenerate ? '🔄' : '⏳';
      const url = img.s3Url || img.replicateUrl || 'pending';
      console.log(`  ${status} ${img.name} → ${img.filename || 'TBD'}`);
      if (img.universe) console.log(`      Universe: ${img.universe}`);
      if (url !== 'pending') console.log(`      URL: ${url}`);
    });
  });
}

function findImage(identifier) {
  const data = loadImageData();
  const allImages = Array.isArray(data) ? data : Object.values(data).flat();
  
  // Try exact matches first
  let result = allImages.find(img => 
    img.id === identifier || 
    img.name === identifier ||
    img.filename === identifier
  );
  
  // Try partial matches
  if (!result) {
    result = allImages.find(img => {
      const searchText = `${img.name} ${img.id || ''} ${img.filename || ''}`.toLowerCase();
      return searchText.includes(identifier.toLowerCase());
    });
  }
  
  if (result) {
    console.log(`\n🔍 FOUND: ${result.name}`);
    console.log(`📁 File: ${result.filename || 'TBD'}`);
    console.log(`📂 Category: ${result.category}`);
    if (result.universe) console.log(`🌍 Universe: ${result.universe}`);
    console.log(`📝 Prompt: ${result.prompt || 'N/A'}`);
    
    if (result.replicateUrl) console.log(`🎨 Replicate: ${result.replicateUrl}`);
    if (result.s3Url) console.log(`☁️ S3: ${result.s3Url}`);
    
    const status = result.approved ? 'Approved ✅' : 
                  result.regenerate ? 'Needs regeneration 🔄' : 
                  result.status === 'generated' ? 'Pending review ⏳' :
                  result.status || 'Unknown';
    console.log(`📊 Status: ${status}`);
    
    if (result.uploadStatus) console.log(`📤 Upload: ${result.uploadStatus}`);
  } else {
    console.log(`❌ No image found matching: ${identifier}`);
    console.log(`💡 Try: node image-lookup.js --search "${identifier}"`);
  }
}

function generateFileMap() {
  const data = loadImageData();
  const allImages = Array.isArray(data) ? data : Object.values(data).flat();
  
  const fileMap = {};
  
  allImages.forEach(img => {
    const key = img.filename || `${img.id || img.name.replace(/[^a-z0-9]/gi, '_')}.png`;
    fileMap[key] = {
      name: img.name,
      category: img.category,
      universe: img.universe,
      s3Path: `images/${img.category}s/${key}`,
      s3Url: img.s3Url,
      replicateUrl: img.replicateUrl,
      status: img.approved ? 'approved' : img.regenerate ? 'regenerate' : 'pending'
    };
  });
  
  const mapFile = path.join(__dirname, 'filename-to-image-map.json');
  fs.writeFileSync(mapFile, JSON.stringify(fileMap, null, 2));
  
  console.log(`📁 File mapping saved to: ${mapFile}`);
  console.log(`\nExample lookups:`);
  Object.entries(fileMap).slice(0, 5).forEach(([filename, info]) => {
    console.log(`  ${filename} → ${info.name} (${info.category})`);
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    listByCategory();
  } else if (args.includes('--search')) {
    const query = args[args.indexOf('--search') + 1];
    if (!query) {
      console.error('❌ Please provide a search term');
      process.exit(1);
    }
    const results = searchImages(query);
    console.log(`\n🔍 Found ${results.length} matches for "${query}":`);
    results.forEach(img => {
      const status = img.approved ? '✅' : img.regenerate ? '🔄' : '⏳';
      console.log(`  ${status} ${img.name} (${img.category}) → ${img.filename || 'TBD'}`);
    });
  } else if (args.includes('--find')) {
    const identifier = args[args.indexOf('--find') + 1];
    if (!identifier) {
      console.error('❌ Please provide an identifier');
      process.exit(1);
    }
    findImage(identifier);
  } else if (args.includes('--map')) {
    generateFileMap();
  } else {
    console.log(`🔍 Image Lookup & Identification Tool

USAGE:
  node image-lookup.js --list                    # List all images by category
  node image-lookup.js --search "harry potter"   # Search for images
  node image-lookup.js --find "ron weasley"      # Find specific image
  node image-lookup.js --map                     # Generate filename mapping

EXAMPLES:
  node image-lookup.js --find "ron_weasley.png"  # Find by filename
  node image-lookup.js --find "Ron Weasley"      # Find by character name
  node image-lookup.js --search "marvel"         # Find all Marvel images
  node image-lookup.js --search "character"      # Find all character images

IDENTIFICATION METHODS:
  • Filename: ron_weasley.png, harry_potter.jpg
  • S3 Path: images/characters/ron_weasley.png  
  • Category: character, universe, spark, interest
  • Universe: harry-potter, marvel, pokemon
  • JSON Metadata: Full tracking with timestamps
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { searchImages, findImage, listByCategory };
