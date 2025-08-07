#!/usr/bin/env node

const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function recoverImageUrls() {
  console.log('🔍 Recovering image URLs from Replicate...\n');
  
  // Load our generated images list
  const generatedFile = path.join(__dirname, 'phase1-generated-images.json');
  if (!fs.existsSync(generatedFile)) {
    console.error('❌ phase1-generated-images.json not found');
    process.exit(1);
  }
  
  const generatedImages = JSON.parse(fs.readFileSync(generatedFile, 'utf8'));
  
  try {
    // Get all recent predictions
    console.log('📡 Fetching predictions from Replicate...');
    const predictions = await replicate.predictions.list();
    
    // Filter for our recent flux-schnell predictions (last 2 hours)
    const recentImages = predictions.results.filter(p => 
      p.model === 'black-forest-labs/flux-schnell' &&
      p.status === 'succeeded' &&
      new Date(p.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000)
    );
    
    console.log(`📊 Found ${recentImages.length} recent successful predictions`);
    
    // Sort by creation time (oldest first to match our generation order)
    recentImages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Create a mapping based on prompts and order
    const updatedImages = [];
    let matchedCount = 0;
    
    generatedImages.forEach((genImage, index) => {
      // Try to find matching prediction by prompt similarity
      const matchingPred = recentImages.find(pred => {
        if (!pred.input || !pred.input.prompt) return false;
        
        // Look for key terms from our prompt in the prediction prompt
        const genPrompt = genImage.prompt.toLowerCase();
        const predPrompt = pred.input.prompt.toLowerCase();
        
        // For characters, check name match
        if (genImage.category === 'character') {
          return predPrompt.includes(genImage.name.toLowerCase());
        }
        
        // For universes, check universe name
        if (genImage.category === 'universe') {
          return predPrompt.includes(genImage.name.toLowerCase());
        }
        
        // For interests and sparks, check key terms
        const keyTerms = genImage.name.toLowerCase().split(/[\s&]+/);
        return keyTerms.some(term => term.length > 3 && predPrompt.includes(term));
      });
      
      if (matchingPred && matchingPred.output && matchingPred.output[0]) {
        updatedImages.push({
          ...genImage,
          replicateUrl: matchingPred.output[0],
          predictionId: matchingPred.id,
          status: 'generated'
        });
        matchedCount++;
        console.log(`✅ Matched: ${genImage.name} → ${matchingPred.output[0]}`);
      } else {
        // Try by index if we have enough predictions
        if (index < recentImages.length && recentImages[index].output) {
          updatedImages.push({
            ...genImage,
            replicateUrl: recentImages[index].output[0],
            predictionId: recentImages[index].id,
            status: 'generated'
          });
          matchedCount++;
          console.log(`✅ Matched by index: ${genImage.name} → ${recentImages[index].output[0]}`);
        } else {
          updatedImages.push({
            ...genImage,
            status: 'missing_url'
          });
          console.log(`❌ No match found for: ${genImage.name}`);
        }
      }
    });
    
    // Save the updated file
    fs.writeFileSync(generatedFile, JSON.stringify(updatedImages, null, 2));
    
    console.log(`\n📊 RECOVERY COMPLETE:`);
    console.log(`✅ Successfully matched: ${matchedCount}/${generatedImages.length}`);
    console.log(`❌ Missing URLs: ${generatedImages.length - matchedCount}`);
    console.log(`📁 Updated: ${generatedFile}`);
    
    // Show some sample URLs
    const withUrls = updatedImages.filter(img => img.replicateUrl);
    if (withUrls.length > 0) {
      console.log(`\n🖼️ SAMPLE RECOVERED IMAGES:`);
      withUrls.slice(0, 5).forEach(img => {
        console.log(`  ${img.name}: ${img.replicateUrl}`);
      });
    }
    
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Generate quality control HTML: node quality-control-helper.js --review-html`);
    console.log(`2. Review images in browser`);
    console.log(`3. Run Phase 2: node phased-image-replacement.js --phase2`);
    
  } catch (error) {
    console.error('❌ Error recovering URLs:', error.message);
  }
}

if (require.main === module) {
  recoverImageUrls();
}

module.exports = { recoverImageUrls };
