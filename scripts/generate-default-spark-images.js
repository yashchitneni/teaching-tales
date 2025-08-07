#!/usr/bin/env node

const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const Replicate = require('replicate');
const AWS = require('aws-sdk');
const https = require('https');
const fs = require('fs');

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

// Default spark configurations that need images
const defaultSparks = [
  {
    id: 'lost-toy',
    name: 'Lost Toy',
    filename: 'lost_toy.png',
    category: 'spark',
    prompt: 'An illustration depicting a child\'s lost favorite toy in a dramatic, colorful storybook style suitable for children\'s adventure stories, emotional and heartwarming scene, high quality artwork',
    isSpecial: true
  },
  {
    id: 'new-friend',
    name: 'New Friend',
    filename: 'new_friend.png',
    category: 'spark',
    prompt: 'An illustration depicting children meeting a new friend in a dramatic, colorful storybook style suitable for children\'s adventure stories, joyful and welcoming scene, high quality artwork',
    isSpecial: true
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    filename: 'birthday_party.png',
    category: 'spark',
    prompt: 'An illustration depicting a magical birthday party celebration in a dramatic, colorful storybook style suitable for children\'s adventure stories, festive and exciting scene, high quality artwork',
    isSpecial: true
  },
  {
    id: 'first-day-school',
    name: 'First Day of School',
    filename: 'first_day_school.png',
    category: 'spark',
    prompt: 'An illustration depicting the first day of school adventure in a dramatic, colorful storybook style suitable for children\'s adventure stories, inspiring and brave scene, high quality artwork'
  },
  {
    id: 'camping-trip',
    name: 'Camping Trip',
    filename: 'camping_trip.png',
    category: 'spark',
    prompt: 'An illustration depicting an exciting camping trip adventure in a dramatic, colorful storybook style suitable for children\'s adventure stories, outdoor adventure scene, high quality artwork'
  },
  {
    id: 'pet-adventure',
    name: 'Pet Adventure',
    filename: 'pet_adventure.png',
    category: 'spark',
    prompt: 'An illustration depicting a thrilling pet adventure in a dramatic, colorful storybook style suitable for children\'s adventure stories, fun and playful scene with animals, high quality artwork'
  },
  {
    id: 'magic-discovery',
    name: 'Magic Discovery',
    filename: 'magic_discovery.png',
    category: 'spark',
    prompt: 'An illustration depicting the discovery of magic in a dramatic, colorful storybook style suitable for children\'s adventure stories, wonder and mystery scene, high quality artwork'
  }
];

async function generateImage(prompt, filename, category) {
  console.log(`🎨 Generating: ${filename}`);
  console.log(`📝 Prompt: ${prompt}`);
  
  try {
    console.log(`🤖 Calling Replicate API...`);
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 80
        }
      }
    );

    console.log(`🎯 Replicate response:`, output);

    if (output && output[0]) {
      const imageUrl = output[0];
      console.log(`📥 Downloading image for ${filename}`);
      const imageBuffer = await downloadImage(imageUrl);
      
      // Upload to S3
      const s3Key = `images/${category}s/${filename}`;
      console.log(`☁️ Uploading to S3: ${s3Key}`);
      await uploadToS3(imageBuffer, s3Key);
      
      const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
      console.log(`✅ Generated and uploaded: ${filename}`);
      console.log(`🔗 S3 URL: ${s3Url}`);
      return s3Url;
    } else {
      console.error(`❌ No output from Replicate for ${filename}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating ${filename}:`, error.message);
    if (error.response) {
      console.error(`🔍 Response details:`, error.response.data);
    }
    return null;
  }
}

async function downloadImage(url) {
  console.log(`🔗 Downloading from: ${url}`);
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      console.log(`📡 Response status: ${response.statusCode}`);
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        console.log(`📦 Downloaded ${Buffer.concat(chunks).length} bytes`);
        resolve(Buffer.concat(chunks));
      });
      response.on('error', reject);
    });
    
    request.on('error', (error) => {
      console.error(`🚨 Download error:`, error);
      reject(error);
    });
    
    request.setTimeout(30000, () => {
      console.error('🕐 Download timeout');
      request.destroy();
      reject(new Error('Download timeout'));
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

async function main() {
  console.log('🚀 Starting default spark image generation...');
  console.log(`📊 Total sparks to process: ${defaultSparks.length}`);
  
  const results = [];
  
  for (const spark of defaultSparks) {
    const s3Url = await generateImage(spark.prompt, spark.filename, spark.category);
    if (s3Url) {
      results.push({
        ...spark,
        s3Url
      });
    }
    
    // Add delay to avoid rate limits
    console.log('⏳ Waiting 3 seconds before next generation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 Generation complete!');
  console.log('\n📋 Results summary:');
  results.forEach(spark => {
    console.log(`✅ ${spark.name}: ${spark.s3Url}`);
  });
  
  // Save results to file for reference
  const outputPath = path.join(__dirname, 'generated-default-sparks.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
  
  return results;
}

// Check for required environment variables
if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable is required');
  process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials environment variables are required');
  process.exit(1);
}

// Run the script
main().catch(console.error);
