#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the complete mockData to extract all character images
function extractAllCharacterImages() {
  const mockDataPath = path.join(__dirname, '../src/lib/mockData.ts');
  const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
  
  const characters = [];
  
  // Extract character data from each universe
  const universeMatches = mockDataContent.match(/'([^']+)':\s*\[([^\]]+)\]/g);
  
  if (universeMatches) {
    universeMatches.forEach(match => {
      const universeName = match.match(/'([^']+)':/)[1];
      if (universeName === 'special') return; // Skip special characters for now
      
      // Extract characters from this universe
      const characterMatches = match.match(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*image:\s*'([^']*)',.*?\}/g);
      
      if (characterMatches) {
        characterMatches.forEach(charMatch => {
          const idMatch = charMatch.match(/id:\s*'([^']+)'/);
          const nameMatch = charMatch.match(/name:\s*'([^']+)'/);
          const imageMatch = charMatch.match(/image:\s*'([^']*)'/);
          const isCustomMatch = charMatch.includes('isCustom: true');
          
          if (idMatch && nameMatch && imageMatch && !isCustomMatch && imageMatch[1].includes('cloudfront')) {
            characters.push({
              id: idMatch[1],
              name: nameMatch[1],
              universe: universeName,
              originalUrl: imageMatch[1],
              filename: `${idMatch[1].replace(/-/g, '_')}.png`,
              prompt: generateCharacterPrompt(nameMatch[1], universeName)
            });
          }
        });
      }
    });
  }
  
  return characters;
}

function generateCharacterPrompt(characterName, universe) {
  const basePrompt = `A colorful, child-friendly illustration of ${characterName}`;
  
  const universeStyles = {
    'amulet': 'in a magical fantasy style with glowing amulet elements',
    'artemis-fowl': 'in a modern fantasy style with technological elements',
    'harry-potter': 'in a magical wizarding style with robes and magical elements',
    'marvel': 'in a superhero comic book style',
    'dc-comics': 'in a superhero comic book style',
    'star-wars': 'in a space fantasy style with sci-fi elements',
    'pokemon': 'in an anime/manga style',
    'mario': 'in a colorful video game cartoon style',
    'lord-of-the-rings': 'in an epic fantasy style',
    'percy-jackson': 'in a modern mythology style with Greek elements',
    'narnia': 'in a fantasy adventure style',
    'my-hero-academia': 'in an anime superhero style',
    'one-piece': 'in an anime pirate adventure style',
    'paw-patrol': 'in a cute cartoon animal style',
    'wings-of-fire': 'in a fantasy dragon style',
    'dork-diaries': 'in a modern teen cartoon style',
    'dog-man': 'in a fun cartoon comic style',
    'boss-baby': 'in a cute business cartoon style',
    'babysitters-club': 'in a friendly modern cartoon style'
  };
  
  const style = universeStyles[universe] || 'in a colorful storybook illustration style';
  return `${basePrompt} ${style}, suitable for children's books, high quality, vibrant colors`;
}

// Complete image generation configuration
function getAllImages() {
  const characters = extractAllCharacterImages();
  
  const universes = [
    { id: 'amulet', name: 'Amulet', filename: 'amulet.jpg' },
    { id: 'artemis-fowl', name: 'Artemis Fowl', filename: 'artemis_fowl.jpg' },
    { id: 'babysitters-club', name: "Babysitter's Club", filename: 'babysitters_club.jpg' },
    { id: 'boss-baby', name: 'Boss Baby', filename: 'boss_baby.jpg' },
    { id: 'dc-comics', name: 'DC Comics Universe', filename: 'dc_comics_universe.jpg' },
    { id: 'dog-man', name: 'Dog Man', filename: 'dog_man.jpg' },
    { id: 'dork-diaries', name: 'Dork Diaries', filename: 'dork_diaries.jpg' },
    { id: 'harry-potter', name: 'Harry Potter', filename: 'harry_potter.jpg' },
    { id: 'lord-of-the-rings', name: 'Lord of the Rings', filename: 'lord_of_the_rings.jpg' },
    { id: 'mario', name: 'Mario', filename: 'mario.jpg' },
    { id: 'marvel', name: 'Marvel', filename: 'marvel.jpg' },
    { id: 'my-hero-academia', name: 'My Hero Academia', filename: 'my_hero_academia.jpg' },
    { id: 'one-piece', name: 'One Piece', filename: 'one_piece.jpg' },
    { id: 'paw-patrol', name: 'Paw Patrol', filename: 'paw_patrol.jpg' },
    { id: 'percy-jackson', name: 'Percy Jackson', filename: 'percy_jackson.jpg' },
    { id: 'pokemon', name: 'Pokémon', filename: 'pokemon.jpg' },
    { id: 'star-wars', name: 'Star Wars', filename: 'star_wars.jpg' },
    { id: 'narnia', name: 'The Chronicles of Narnia', filename: 'narnia.jpg' },
    { id: 'wings-of-fire', name: 'Wings of Fire', filename: 'wings_of_fire.jpg' }
  ].map(u => ({
    ...u,
    category: 'universe',
    prompt: `A book cover style illustration representing the ${u.name} universe, magical and colorful, appealing to young readers, high quality artwork`
  }));

  const interests = [
    'Sports', 'Animals', 'Science & Nature', 'History & Culture', 'Arts & Crafts',
    'Technology & Innovation', 'Literature & Stories', 'Travel & Geography',
    'Team Sports', 'Individual Sports', 'Adventure Sports', 'Water Sports',
    'Winter Sports', 'Athletics', 'Mind Sports'
  ].map((interest, i) => ({
    id: interest.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: interest,
    filename: `${interest.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1024x585.webp`,
    category: 'interest',
    prompt: `An illustration representing ${interest} in a colorful, child-friendly educational style, suitable for learning content, vibrant and engaging`
  }));

  const sparks = [
    'The Last Train at Midnight',
    'Mysterious Map in a Bottle',
    'The Playground Pact',
    'A rift opens, releasing strange creatures into the world',
    'The amulet begins to glow, pointing to an uncharted region',
    'A group of resistance fighters goes missing during a mission',
    'An ancient artifact is discovered, with powers that rival the amulet itself'
  ].map((spark, i) => ({
    id: spark.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: spark,
    filename: `${spark.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
    category: 'spark',
    prompt: `An illustration depicting "${spark}" in a dramatic, colorful storybook style suitable for children's adventure stories, high quality artwork`
  }));

  return {
    universes,
    characters,
    sparks,
    interests,
    total: universes.length + characters.length + sparks.length + interests.length
  };
}

// Create the image generation script
function createGenerationScript() {
  const allImages = getAllImages();
  
  const script = `#!/usr/bin/env node

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

// Image configuration
const images = ${JSON.stringify(allImages, null, 2)};

async function generateImage(prompt, filename, category) {
  console.log(\`Generating: \${filename}\`);
  
  try {
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: category === 'interest' ? '16:9' : '1:1',
          output_format: 'png',
          output_quality: 80
        }
      }
    );

    if (output && output[0]) {
      const imageUrl = output[0];
      const imageBuffer = await downloadImage(imageUrl);
      
      // Upload to S3
      const s3Key = \`images/\${category}s/\${filename}\`;
      await uploadToS3(imageBuffer, s3Key);
      
      console.log(\`✅ Generated and uploaded: \${filename}\`);
      return \`https://\${BUCKET_NAME}.s3.amazonaws.com/\${s3Key}\`;
    }
  } catch (error) {
    console.error(\`❌ Error generating \${filename}:\`, error);
    return null;
  }
}

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

async function processCategory(categoryName, items) {
  console.log(\`\\n🎨 Processing \${items.length} \${categoryName} images...\`);
  
  const results = [];
  for (const item of items) {
    const s3Url = await generateImage(item.prompt, item.filename, item.category);
    if (s3Url) {
      results.push({
        ...item,
        s3Url
      });
    }
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting image generation and upload process...');
  console.log(\`Total images to process: \${images.total}\`);
  
  const results = {
    universes: await processCategory('universe', images.universes),
    characters: await processCategory('character', images.characters),
    sparks: await processCategory('spark', images.sparks),
    interests: await processCategory('interest', images.interests)
  };
  
  // Save mapping for code updates
  const mappingFile = path.join(__dirname, 'image-url-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(results, null, 2));
  
  console.log(\`\\n✅ Complete! Results saved to \${mappingFile}\`);
  console.log(\`Generated \${Object.values(results).flat().length} images\`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateImage, processCategory };
`;

  return script;
}

// Generate and save all files
const allImages = getAllImages();

// Save the complete image list
fs.writeFileSync(
  path.join(__dirname, 'complete-image-list.json'), 
  JSON.stringify(allImages, null, 2)
);

// Save the generation script
fs.writeFileSync(
  path.join(__dirname, 'run-image-generation.js'), 
  createGenerationScript()
);

// Make it executable
try {
  execSync('chmod +x scripts/run-image-generation.js', { cwd: path.join(__dirname, '..') });
} catch (e) {
  // Windows doesn't need chmod
}

console.log(`📊 Complete image analysis:`);
console.log(`- Universes: ${allImages.universes.length}`);
console.log(`- Characters: ${allImages.characters.length}`);
console.log(`- Sparks: ${allImages.sparks.length}`);
console.log(`- Interests: ${allImages.interests.length}`);
console.log(`- Total: ${allImages.total}`);
console.log(`\n💰 Estimated cost: $${(allImages.total * 0.05).toFixed(2)}`);
console.log(`\n📁 Files created:`);
console.log(`- complete-image-list.json`);
console.log(`- run-image-generation.js`);
console.log(`\n🚀 To generate images, run:`);
console.log(`cd scripts && REPLICATE_API_TOKEN=your_token AWS_ACCESS_KEY_ID=your_key AWS_SECRET_ACCESS_KEY=your_secret node run-image-generation.js`);
