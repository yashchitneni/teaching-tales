#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const fs = require('fs');

const BUCKET_NAME = 'teaching-tales-production-teachingtalesbucketbucket-ncvkkabz';

// URLs from the previous run
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

async function downloadAndUpload(imageInfo) {
  const { name, url, id } = imageInfo;
  console.log(`🎨 Processing: ${name}`);
  
  try {
    // Download using curl
    const tempFile = `/tmp/${name}`;
    console.log(`📥 Downloading with curl: ${url}`);
    execSync(`curl -L "${url}" -o "${tempFile}"`, { stdio: 'inherit' });
    
    // Check if file was downloaded
    if (!fs.existsSync(tempFile)) {
      throw new Error('File not downloaded');
    }
    
    console.log(`📏 File size: ${fs.statSync(tempFile).size} bytes`);
    
    // Upload to S3 using AWS CLI (directly to images folder like other files)
    const s3Key = `images/${name}`;
    const s3Path = `s3://${BUCKET_NAME}/${s3Key}`;
    
    console.log(`☁️ Uploading to S3 with AWS CLI: ${s3Key}`);
    execSync(`aws s3 cp "${tempFile}" "${s3Path}" --region us-east-1 --content-type image/png`, { stdio: 'inherit' });
    
    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    console.log(`✅ Uploaded: ${name}`);
    console.log(`🔗 S3 URL: ${s3Url}`);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return {
      id,
      name: name.replace('.png', '').replace(/_/g, '-'),
      filename: name,
      s3Url
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting download and upload process...');
  console.log(`📊 Total images to process: ${imageUrls.length}`);
  
  const results = [];
  
  for (const imageInfo of imageUrls) {
    const result = await downloadAndUpload(imageInfo);
    if (result) {
      results.push(result);
    }
    
    // Small delay between uploads
    console.log('⏳ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Process complete!');
  console.log('\n📋 Results summary:');
  results.forEach(result => {
    console.log(`✅ ${result.name}: ${result.s3Url}`);
  });
  
  // Save results
  const outputPath = path.join(__dirname, 'uploaded-spark-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
  
  return results;
}

main().catch(console.error);
