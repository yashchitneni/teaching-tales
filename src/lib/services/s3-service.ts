import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Service for uploading files to S3 bucket
 * 
 * Handles image uploads for generated story illustrations,
 * using the SST-managed S3 bucket with proper naming and caching.
 */
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({});
    this.bucketName = this.getBucketName();
  }

  /**
   * Get bucket name from SST Resource or fallback to environment variable
   */
  private getBucketName(): string {
    try {
      const { Resource } = require('sst');
      return Resource.TeachingTalesBucket.name;
    } catch (error) {
      // Fallback for local development
      return process.env.S3_BUCKET_NAME || 'teaching-tales-production-teachingtalesbucketbucket-ncvkkabz';
    }
  }

  /**
   * Upload an image blob to S3 and return the public URL
   * 
   * @param imageBlob - Image data as blob or buffer
   * @param fileName - Name for the file (without extension)
   * @param contentType - MIME type of the image
   * @returns Promise resolving to the public S3 URL
   */
  async uploadImage(
    imageBlob: Blob | Buffer,
    fileName: string,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    try {
      // Convert blob to buffer if needed
      let imageBuffer: Buffer;
      if (imageBlob instanceof Blob) {
        imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
      } else {
        imageBuffer = imageBlob;
      }

      // Generate unique key with timestamp
      const timestamp = Date.now();
      const key = `generated-images/${fileName}-${timestamp}.jpg`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // Cache for 1 year
      };

      console.log(`📤 Uploading image to S3: ${key}`);
      
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Return public URL
      const imageUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      console.log(`✅ Image uploaded successfully: ${imageUrl}`);
      
      return imageUrl;

    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw new Error(`Failed to upload image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download an image from a URL and upload it to S3
   * 
   * @param imageUrl - URL of the image to download and upload
   * @param fileName - Name for the file (without extension)
   * @returns Promise resolving to the S3 URL
   */
  async downloadAndUpload(imageUrl: string, fileName: string): Promise<string> {
    try {
      console.log(`📥 Downloading image from: ${imageUrl}`);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBlob = await response.blob();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      return await this.uploadImage(imageBlob, fileName, contentType);

    } catch (error) {
      console.error('❌ Download and upload failed:', error);
      
      // Fallback to original URL if S3 upload fails
      console.log('🔄 Falling back to original image URL');
      return imageUrl;
    }
  }

  /**
   * Generate a safe filename from story metadata
   * 
   * @param storyTitle - Title of the story
   * @param storyId - Unique story identifier
   * @returns Safe filename string
   */
  generateFileName(storyTitle: string, storyId?: string): string {
    // Clean the title for filename use
    const cleanTitle = storyTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .substring(0, 50); // Limit length

    const suffix = storyId ? `-${storyId}` : '';
    return `story-${cleanTitle}${suffix}`;
  }
}
