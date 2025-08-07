# CloudFront to S3 Image Replacement Guide

This guide will help you replace all CloudFront CDN images with AI-generated images stored in your S3 bucket.

## 📊 Summary

- **Total Images**: 171
- **Categories**: 
  - Universes: 19 images
  - Characters: 130+ images  
  - Sparks: 7 images
  - Interests: 15 images
- **Estimated Cost**: ~$8.55 (using Replicate Flux-Schnell)

## 🔧 Prerequisites

1. **Replicate API Token**
   ```bash
   export REPLICATE_API_TOKEN="your_replicate_token_here"
   ```

2. **AWS Credentials** 
   ```bash
   export AWS_ACCESS_KEY_ID="your_aws_key"
   export AWS_SECRET_ACCESS_KEY="your_aws_secret"
   export AWS_REGION="us-east-1"
   ```

3. **Node.js Dependencies**
   ```bash
   npm install replicate aws-sdk
   ```

## 🚀 Phased Process (Recommended)

### Phase 1: Generate Images with Quality Control
```bash
# Generate all images on Replicate
cd scripts
node phased-image-replacement.js --phase1

# Review generated images in browser
node quality-control-helper.js --review-html
# Open image-review.html to approve/reject images
```

**Quality Control:**
- Review all 171 generated images in a web interface
- Mark images as ✅ Approved or 🔄 Regenerate  
- Add custom prompts for better results
- Download updated JSON file

### Phase 2: Upload Approved Images
```bash
# Upload only approved images to S3
node phased-image-replacement.js --phase2
```

**Spot Check:**
- Verify S3 URLs load correctly
- Check image quality and sizing
- Confirm public read permissions

### Phase 3: Update Application URLs
```bash
# Replace CloudFront URLs with S3 URLs
node phased-image-replacement.js --phase3

# Test your application
npm run dev
```

## 🚀 Alternative: All-at-Once Process

If you want to skip quality control and generate everything:

```bash
cd scripts
node run-image-generation.js  # One-shot generation + upload
node update-image-urls.js      # Update URLs
```

## 🔄 Rollback (if needed)

If something goes wrong, restore from backups:
```bash
cd scripts
node update-image-urls.js --restore
```

## 📁 Generated Files

After running the scripts, you'll have:

- `scripts/complete-image-list.json` - Full inventory of images
- `scripts/run-image-generation.js` - Image generation script
- `scripts/image-url-mapping.json` - Final S3 URLs
- `scripts/url-mappings.json` - URL replacement mappings
- Backup files (`.backup` extension)

## 🎨 Image Generation Details

### Universe Images
- Style: Book cover illustrations
- Dimensions: 1:1 aspect ratio
- Format: PNG
- Examples: "A magical Harry Potter universe illustration"

### Character Images  
- Style: Colorful, child-friendly character portraits
- Universe-specific styling (anime, comic book, fantasy, etc.)
- Dimensions: 1:1 aspect ratio
- Format: PNG

### Spark Images
- Style: Dramatic story starter illustrations  
- Examples: "A mysterious train at midnight"
- Dimensions: 1:1 aspect ratio
- Format: PNG

### Interest Images
- Style: Educational, vibrant illustrations
- Dimensions: 16:9 aspect ratio  
- Format: WebP
- Examples: "Sports illustration for children"

## 💰 Cost Breakdown

- **Replicate Flux-Schnell**: ~$0.05 per image
- **Total**: 171 images × $0.05 = ~$8.55
- **AWS S3 Storage**: Minimal (few GB)
- **S3 Bandwidth**: Pay-per-use

## 🚨 Important Notes

1. **Backup First**: The script creates backups, but consider git commit before running
2. **Test Thoroughly**: Verify all image categories load correctly
3. **Rate Limits**: The script includes 2-second delays between generations
4. **Quality Check**: Review generated images - regenerate any that don't meet standards
5. **S3 Permissions**: Ensure your S3 bucket allows public read access for images

## 🐛 Troubleshooting

### Images not loading?
- Check S3 bucket permissions (public read)
- Verify URLs in browser
- Check AWS credentials

### Generation failed?
- Verify Replicate API token
- Check internet connection
- Review error logs

### URLs not updated?
- Run dry-run first to verify mappings
- Check file permissions
- Review backup files

## 📞 Support

Generated files include detailed logs and mappings for debugging. Check:
- `image-url-mapping.json` for final URLs
- Console output for generation status
- Browser network tab for loading issues
