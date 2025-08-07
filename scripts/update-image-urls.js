#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// S3 bucket base URL
const S3_BASE_URL = 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com';

// Files to update
const FILES_TO_UPDATE = [
  'src/app/create-book/universe/page.tsx',
  'src/lib/mockData.ts',
  'src/app/create-book/spark/page.tsx'
];

// Generate URL mappings
function generateUrlMappings() {
  const mappings = new Map();

  // Universe mappings
  const universes = [
    'amulet', 'artemis-fowl', 'babysitters-club', 'boss-baby', 'dc-comics-universe',
    'dog-man', 'dork-diaries', 'harry-potter', 'lord-of-the-rings', 'mario',
    'marvel', 'my-hero-academia', 'one-piece', 'paw-patrol', 'percy-jackson',
    'pokemon', 'star-wars', 'narnia', 'wings-of-fire'
  ];

  universes.forEach(universe => {
    const oldUrl = `https://d3dp0uoydvg1je.cloudfront.net/universes/${universe}.jpg`;
    const filename = universe.replace(/-/g, '_') + '.jpg';
    const newUrl = `${S3_BASE_URL}/images/universes/${filename}`;
    mappings.set(oldUrl, newUrl);
  });

  // Interest mappings
  const interests = [
    'sports', 'animals', 'science_nature', 'history_culture', 'arts_crafts',
    'technology_innovation', 'literature_stories', 'travel_geography',
    'team_sports', 'individual_sports', 'adventure_sports', 'water_sports',
    'winter_sports', 'athletics', 'mind_sports'
  ];

  interests.forEach(interest => {
    const oldUrl = `https://d3dp0uoydvg1je.cloudfront.net/interests/${interest}_1024x585.webp`;
    const newUrl = `${S3_BASE_URL}/images/interests/${interest}_1024x585.webp`;
    mappings.set(oldUrl, newUrl);
  });

  // Character mappings (extract from mockData)
  const mockDataPath = path.join(__dirname, '../src/lib/mockData.ts');
  const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
  
  // Extract all CloudFront character URLs
  const characterUrlMatches = mockDataContent.match(/https:\/\/d3dp0uoydvg1je\.cloudfront\.net\/dilemmas\/[^']+\.png/g);
  if (characterUrlMatches) {
    characterUrlMatches.forEach((oldUrl, index) => {
      // Extract character ID from the surrounding context
      const urlIndex = mockDataContent.indexOf(oldUrl);
      const beforeUrl = mockDataContent.substring(Math.max(0, urlIndex - 200), urlIndex);
      const idMatch = beforeUrl.match(/id:\s*'([^']+)'/g);
      
      if (idMatch) {
        const lastIdMatch = idMatch[idMatch.length - 1];
        const characterId = lastIdMatch.match(/'([^']+)'/)[1];
        const filename = characterId.replace(/-/g, '_') + '.png';
        const newUrl = `${S3_BASE_URL}/images/characters/${filename}`;
        mappings.set(oldUrl, newUrl);
      }
    });
  }

  // Spark mappings (article-attributes and dilemmas)
  const sparkMappings = [
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0.png',
      new: `${S3_BASE_URL}/images/sparks/the_last_train_at_midnight.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/e5a81b3c-1b8e-4f9d-85b0-4e0bc3c3370d.png',
      new: `${S3_BASE_URL}/images/sparks/mysterious_map_in_a_bottle.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8.png',
      new: `${S3_BASE_URL}/images/sparks/the_playground_pact.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/1e980d58-f380-4b40-985f-0fbfc73f8846.png',
      new: `${S3_BASE_URL}/images/sparks/a_rift_opens__releasing_strange_creatures_into_the_world.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/5865612f-c67f-4d77-9380-60761110f342.png',
      new: `${S3_BASE_URL}/images/sparks/the_amulet_begins_to_glow__pointing_to_an_uncharted_region.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/8c41743e-7385-4c2a-a3d2-f683b22fb652.png',
      new: `${S3_BASE_URL}/images/sparks/a_group_of_resistance_fighters_goes_missing_during_a_mission.png`
    },
    {
      old: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/8f32ebba-3e6d-47e1-b42b-73c54d403a7c.png',
      new: `${S3_BASE_URL}/images/sparks/an_ancient_artifact_is_discovered__with_powers_that_rival_the_amulet_itself.png`
    }
  ];

  sparkMappings.forEach(mapping => {
    mappings.set(mapping.old, mapping.new);
  });

  return mappings;
}

function updateFileUrls(filePath, urlMappings) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  urlMappings.forEach((newUrl, oldUrl) => {
    const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newUrl);
      changes += matches.length;
    }
  });

  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${changes} URLs in ${filePath}`);
    return true;
  } else {
    console.log(`📄 No changes needed in ${filePath}`);
    return false;
  }
}

function createBackups() {
  console.log('📂 Creating backups...');
  FILES_TO_UPDATE.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    const backupPath = fullPath + '.backup';
    
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, backupPath);
      console.log(`📋 Backup created: ${filePath}.backup`);
    }
  });
}

function restoreBackups() {
  console.log('🔄 Restoring from backups...');
  FILES_TO_UPDATE.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    const backupPath = fullPath + '.backup';
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fullPath);
      console.log(`🔄 Restored: ${filePath}`);
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--restore')) {
    restoreBackups();
    return;
  }

  if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No files will be modified');
  } else {
    createBackups();
  }

  const urlMappings = generateUrlMappings();
  console.log(`\n🔄 Generated ${urlMappings.size} URL mappings`);

  let totalChanges = 0;
  FILES_TO_UPDATE.forEach(filePath => {
    if (!args.includes('--dry-run')) {
      const changed = updateFileUrls(filePath, urlMappings);
      if (changed) totalChanges++;
    } else {
      // Just show what would be changed
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        let potentialChanges = 0;
        
        urlMappings.forEach((newUrl, oldUrl) => {
          const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const matches = content.match(regex);
          if (matches) {
            potentialChanges += matches.length;
          }
        });
        
        if (potentialChanges > 0) {
          console.log(`📄 Would update ${potentialChanges} URLs in ${filePath}`);
        } else {
          console.log(`📄 No changes needed in ${filePath}`);
        }
      }
    }
  });

  if (!args.includes('--dry-run')) {
    console.log(`\n✅ Successfully updated ${totalChanges} files`);
    console.log(`\n📝 To restore from backups, run: node update-image-urls.js --restore`);
  } else {
    console.log(`\n🔍 Dry run complete. Run without --dry-run to apply changes.`);
  }

  // Save mappings for reference
  const mappingArray = Array.from(urlMappings.entries()).map(([old, newUrl]) => ({ old, new: newUrl }));
  fs.writeFileSync(
    path.join(__dirname, 'url-mappings.json'),
    JSON.stringify(mappingArray, null, 2)
  );
  console.log(`📁 URL mappings saved to url-mappings.json`);
}

if (require.main === module) {
  main();
}

module.exports = { generateUrlMappings, updateFileUrls };
