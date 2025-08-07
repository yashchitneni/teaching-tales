#!/usr/bin/env node

const Replicate = require('replicate');
const AWS = require('aws-sdk');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Initialize clients
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = 'teaching-tales-production-teachingtalesbucketbucket-ncvkkabz';

// Load image configuration
function loadImageConfig() {
  const configPath = path.join(__dirname, 'complete-image-list.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ complete-image-list.json not found. Run generate-and-upload-images.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// PHASE 1: Generate images on Replicate
async function phase1_generateImages() {
  console.log('🎨 PHASE 1: Generating images on Replicate...\n');
  
  const config = loadImageConfig();
  const allItems = [
    ...config.universes,
    ...config.characters,
    ...config.sparks,
    ...config.interests
  ];

  const results = [];
  let completed = 0;

  for (const item of allItems) {
    console.log(`[${completed + 1}/${allItems.length}] Generating: ${item.name}`);
    
    try {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: item.prompt,
            go_fast: true,
            megapixels: "1",
            num_outputs: 1,
            aspect_ratio: item.category === 'interest' ? '16:9' : '1:1',
            output_format: 'png',
            output_quality: 80
          }
        }
      );

      if (output && output[0]) {
        results.push({
          ...item,
          replicateUrl: output[0],
          status: 'generated',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Generated: ${item.name}`);
      } else {
        results.push({
          ...item,
          status: 'failed',
          error: 'No output received',
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Failed: ${item.name}`);
      }
    } catch (error) {
      results.push({
        ...item,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Error generating ${item.name}: ${error.message}`);
    }

    completed++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save results
  const resultsFile = path.join(__dirname, 'phase1-generated-images.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  const successful = results.filter(r => r.status === 'generated');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`\n📊 PHASE 1 COMPLETE:`);
  console.log(`✅ Successfully generated: ${successful.length}/${allItems.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📁 Results saved to: phase1-generated-images.json`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed items:`);
    failed.forEach(item => {
      console.log(`   - ${item.name}: ${item.error}`);
    });
  }

  console.log(`\n🔍 NEXT STEPS:`);
  console.log(`1. Review generated images at the Replicate URLs`);
  console.log(`2. Edit phase1-generated-images.json to:`);
  console.log(`   - Mark images as approved: "approved": true`);
  console.log(`   - Mark for regeneration: "regenerate": true`);
  console.log(`   - Add custom prompts: "customPrompt": "new prompt"`);
  console.log(`3. Run: node phased-image-replacement.js --phase2`);
}

// PHASE 2: Upload approved images to S3
async function phase2_uploadToS3() {
  console.log('☁️ PHASE 2: Uploading approved images to S3...\n');
  
  const resultsFile = path.join(__dirname, 'phase1-generated-images.json');
  if (!fs.existsSync(resultsFile)) {
    console.error('❌ phase1-generated-images.json not found. Run phase 1 first.');
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const approvedItems = items.filter(item => 
    item.status === 'generated' && 
    item.approved === true && 
    !item.regenerate
  );

  if (approvedItems.length === 0) {
    console.log('⚠️ No approved images found. Please edit phase1-generated-images.json and mark images as approved.');
    return;
  }

  console.log(`📤 Uploading ${approvedItems.length} approved images...\n`);

  const uploadResults = [];
  let completed = 0;

  for (const item of approvedItems) {
    console.log(`[${completed + 1}/${approvedItems.length}] Uploading: ${item.name}`);
    
    try {
      // Download from Replicate
      const imageBuffer = await downloadImage(item.replicateUrl);
      
      // Upload to S3
      const s3Key = `images/${item.category}s/${item.filename}`;
      await uploadToS3(imageBuffer, s3Key);
      
      const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
      
      uploadResults.push({
        ...item,
        s3Url,
        s3Key,
        uploadStatus: 'success',
        uploadTimestamp: new Date().toISOString()
      });
      
      console.log(`✅ Uploaded: ${item.name}`);
      console.log(`   S3 URL: ${s3Url}`);
      
    } catch (error) {
      uploadResults.push({
        ...item,
        uploadStatus: 'failed',
        uploadError: error.message,
        uploadTimestamp: new Date().toISOString()
      });
      console.log(`❌ Upload failed for ${item.name}: ${error.message}`);
    }
    
    completed++;
  }

  // Save upload results
  const uploadResultsFile = path.join(__dirname, 'phase2-uploaded-images.json');
  fs.writeFileSync(uploadResultsFile, JSON.stringify(uploadResults, null, 2));

  const successful = uploadResults.filter(r => r.uploadStatus === 'success');
  const failed = uploadResults.filter(r => r.uploadStatus === 'failed');

  console.log(`\n📊 PHASE 2 COMPLETE:`);
  console.log(`✅ Successfully uploaded: ${successful.length}/${approvedItems.length}`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  console.log(`📁 Results saved to: phase2-uploaded-images.json`);

  console.log(`\n🔍 NEXT STEPS:`);
  console.log(`1. Spot check S3 URLs to verify images loaded correctly`);
  console.log(`2. Run: node phased-image-replacement.js --phase3`);
}

// PHASE 3: Update application URLs
async function phase3_updateUrls() {
  console.log('🔄 PHASE 3: Updating application URLs...\n');
  
  const uploadResultsFile = path.join(__dirname, 'phase2-uploaded-images.json');
  if (!fs.existsSync(uploadResultsFile)) {
    console.error('❌ phase2-uploaded-images.json not found. Run phase 2 first.');
    process.exit(1);
  }

  const uploadedItems = JSON.parse(fs.readFileSync(uploadResultsFile, 'utf8'));
  const successfulUploads = uploadedItems.filter(item => item.uploadStatus === 'success');

  if (successfulUploads.length === 0) {
    console.log('⚠️ No successful uploads found. Please complete phase 2 first.');
    return;
  }

  // Create URL mappings
  const urlMappings = new Map();
  
  // Add specific mappings for each uploaded image
  successfulUploads.forEach(item => {
    if (item.originalUrl) {
      urlMappings.set(item.originalUrl, item.s3Url);
    }
  });

  // Add CloudFront universe mappings
  const universeUploads = successfulUploads.filter(item => item.category === 'universe');
  universeUploads.forEach(item => {
    const cloudFrontUrl = `https://d3dp0uoydvg1je.cloudfront.net/universes/${item.id}.jpg`;
    urlMappings.set(cloudFrontUrl, item.s3Url);
  });

  // Add interest mappings
  const interestUploads = successfulUploads.filter(item => item.category === 'interest');
  interestUploads.forEach(item => {
    const cloudFrontUrl = `https://d3dp0uoydvg1je.cloudfront.net/interests/${item.id}_1024x585.webp`;
    urlMappings.set(cloudFrontUrl, item.s3Url);
  });

  console.log(`🔄 Generated ${urlMappings.size} URL mappings`);

  // Apply URL updates using existing update script
  const { updateFileUrls } = require('./update-image-urls.js');
  
  const filesToUpdate = [
    'src/app/create-book/universe/page.tsx',
    'src/lib/mockData.ts',
    'src/app/create-book/spark/page.tsx'
  ];

  // Create backups
  console.log('📂 Creating backups...');
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    const backupPath = fullPath + '.phase3.backup';
    
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, backupPath);
      console.log(`📋 Backup created: ${filePath}.phase3.backup`);
    }
  });

  // Update files
  let totalChanges = 0;
  filesToUpdate.forEach(filePath => {
    const changed = updateFileUrls(filePath, urlMappings);
    if (changed) totalChanges++;
  });

  // Save final mapping
  const finalMappingFile = path.join(__dirname, 'phase3-final-url-mappings.json');
  const mappingArray = Array.from(urlMappings.entries()).map(([old, newUrl]) => ({ old, new: newUrl }));
  fs.writeFileSync(finalMappingFile, JSON.stringify(mappingArray, null, 2));

  console.log(`\n📊 PHASE 3 COMPLETE:`);
  console.log(`✅ Updated ${totalChanges} files`);
  console.log(`🔄 Applied ${urlMappings.size} URL mappings`);
  console.log(`📁 Final mappings saved to: phase3-final-url-mappings.json`);

  console.log(`\n🎉 ALL PHASES COMPLETE!`);
  console.log(`🧪 Test your application: npm run dev`);
  console.log(`🔙 To rollback: Restore from .phase3.backup files`);
}

// Utility functions
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function uploadToS3(buffer, key) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  };

  return s3.upload(params).promise();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--phase1')) {
    await phase1_generateImages();
  } else if (args.includes('--phase2')) {
    await phase2_uploadToS3();
  } else if (args.includes('--phase3')) {
    await phase3_updateUrls();
  } else {
    console.log(`🚀 Phased Image Replacement Tool

USAGE:
  node phased-image-replacement.js --phase1   # Generate images on Replicate
  node phased-image-replacement.js --phase2   # Upload approved images to S3  
  node phased-image-replacement.js --phase3   # Update application URLs

WORKFLOW:
  1. Run phase 1, then review generated images
  2. Edit phase1-generated-images.json to approve/reject images
  3. Run phase 2, then spot check S3 uploads
  4. Run phase 3 to update your application

REQUIREMENTS:
  - REPLICATE_API_TOKEN environment variable
  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  - complete-image-list.json (run generate-and-upload-images.js first)
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { phase1_generateImages, phase2_uploadToS3, phase3_updateUrls };
