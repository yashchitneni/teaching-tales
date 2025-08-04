#!/usr/bin/env node

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Initialize S3 client (SST handles AWS credentials automatically)
const s3Client = new S3Client({});

// Get bucket name from SST environment
const BUCKET_NAME = process.env.TEACHING_TALES_BUCKET_NAME || process.env.BUCKET_NAME || 'teaching-tales-duff-teachingtalesbucketbucket-zwfotuof';

const imagesDir = path.join(__dirname, 'teachtales_images_library');

async function uploadImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => file.endsWith('.webp'));
    const uploadedUrls = [];
    
    console.log(`Found ${imageFiles.length} images to upload`);
    
    for (const file of imageFiles) {
      const filePath = path.join(imagesDir, file);
      const fileContent = fs.readFileSync(filePath);
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: `images/${file}`, // Store in 'images' folder
        Body: fileContent,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000', // Cache for 1 year
      };
      
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      
      const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/images/${file}`;
      uploadedUrls.push(imageUrl);
      
      console.log(`✓ Uploaded: ${file}`);
    }
    
    console.log('\nAll images uploaded successfully!');
    console.log('\nImage URLs:');
    uploadedUrls.forEach(url => console.log(url));
    
    // Also save to file
    fs.writeFileSync(path.join(__dirname, 'uploaded-urls.txt'), uploadedUrls.join('\n'));
    console.log('\nURLs saved to uploaded-urls.txt');
    
  } catch (error) {
    console.error('Error uploading images:', error);
  }
}

uploadImages();
