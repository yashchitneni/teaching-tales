#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// URLs from the Replicate generation
const imageUrls = [
  {
    name: 'lost_toy.png',
    url: 'https://replicate.delivery/xezq/TjPIGM8WEF7xN5MCfqbEzGbZkRZsZ8pAwXduIFfsbzQcMnIVA/out-0.png',
    id: 'lost-toy'
  },
  {
    name: 'new_friend.png',
    url: 'https://replicate.delivery/xezq/iGnODCAqkArbINBpUf8cB1GGURBjghz47R2JT7E9nBdQmTkKA/out-0.png',
    id: 'new-friend'
  },
  {
    name: 'birthday_party.png',
    url: 'https://replicate.delivery/xezq/TGlBl9h8d4qsAlZmktqGqihgKXeJAWiZ4MSULJbTyRSSmTkKA/out-0.png',
    id: 'birthday-party'
  },
  {
    name: 'first_day_school.png',
    url: 'https://replicate.delivery/xezq/vFBTbbzKeh29Pyhbq0xQbx6OrEnuVPchNf0kIw55hJeQZORqA/out-0.png',
    id: 'first-day-school'
  },
  {
    name: 'camping_trip.png',
    url: 'https://replicate.delivery/xezq/skMeIelVbGsySUHPgzo1yjFSwFIJVyeiOvFZu4AHwfhzyciUB/out-0.png',
    id: 'camping-trip'
  },
  {
    name: 'pet_adventure.png',
    url: 'https://replicate.delivery/xezq/KpJLv1RHXDakAxtFPWghBVkvzhey6hxYuiAp3leczj1xMnIVA/out-0.png',
    id: 'pet-adventure'
  },
  {
    name: 'magic_discovery.png',
    url: 'https://replicate.delivery/xezq/JN5bqgjSPaZIGZ4Av2hl4nWbRc1fV7mzhyr59JSrsZf0MnIVA/out-0.png',
    id: 'magic-discovery'
  }
];

const publicDir = path.join(__dirname, '../public/sparks');

// Create the sparks directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function downloadSpark(imageInfo) {
  const { name, url, id } = imageInfo;
  console.log(`🎨 Downloading: ${name}`);
  
  try {
    const targetFile = path.join(publicDir, name);
    console.log(`📥 Downloading to: ${targetFile}`);
    execSync(`curl -L "${url}" -o "${targetFile}"`, { stdio: 'inherit' });
    
    // Check if file was downloaded
    if (!fs.existsSync(targetFile)) {
      throw new Error('File not downloaded');
    }
    
    console.log(`📏 File size: ${fs.statSync(targetFile).size} bytes`);
    console.log(`✅ Downloaded: ${name}`);
    
    return {
      id,
      name: name.replace('.png', '').replace(/_/g, '-'),
      filename: name,
      url: `/sparks/${name}`
    };
    
  } catch (error) {
    console.error(`❌ Error downloading ${name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Downloading spark images to public folder...');
  console.log(`📊 Total images to download: ${imageUrls.length}`);
  console.log(`📁 Target directory: ${publicDir}`);
  
  const results = [];
  
  for (const imageInfo of imageUrls) {
    const result = await downloadSpark(imageInfo);
    if (result) {
      results.push(result);
    }
    
    // Small delay between downloads
    console.log('⏳ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Download complete!');
  console.log('\n📋 Results summary:');
  results.forEach(result => {
    console.log(`✅ ${result.name}: ${result.url}`);
  });
  
  // Save results
  const outputPath = path.join(__dirname, 'local-spark-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
  
  return results;
}

main().catch(console.error);
