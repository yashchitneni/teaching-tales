#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to extract all CloudFront URLs from files
function extractCloudFrontImages() {
  const images = {
    universes: [],
    characters: [],
    sparks: [],
    interests: []
  };

  // Universe images from universe page
  const universeData = `
    { id: 'amulet', name: 'Amulet', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/amulet.jpg' },
    { id: 'artemis-fowl', name: 'Artemis Fowl', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/artemis-fowl.jpg' },
    { id: 'babysitters-club', name: "Babysitter's Club", image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/babysitters-club.jpg' },
    { id: 'boss-baby', name: 'Boss Baby', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/boss-baby.jpg' },
    { id: 'dc-comics', name: 'DC Comics Universe', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dc-comics-universe.jpg' },
    { id: 'dog-man', name: 'Dog Man', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dog-man.jpg' },
    { id: 'dork-diaries', name: 'Dork Diaries', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dork-diaries.jpg' },
    { id: 'harry-potter', name: 'Harry Potter', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/harry-potter.jpg' },
    { id: 'lord-of-the-rings', name: 'Lord of the Rings', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/lord-of-the-rings.jpg' },
    { id: 'mario', name: 'Mario', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/mario.jpg' },
    { id: 'marvel', name: 'Marvel', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/marvel.jpg' },
    { id: 'my-hero-academia', name: 'My Hero Academia', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/my-hero-academia.jpg' },
    { id: 'one-piece', name: 'One Piece', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/one-piece.jpg' },
    { id: 'paw-patrol', name: 'Paw Patrol', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/paw-patrol.jpg' },
    { id: 'percy-jackson', name: 'Percy Jackson', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/percy-jackson.jpg' },
    { id: 'pokemon', name: 'Pokémon', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/pokemon.jpg' },
    { id: 'star-wars', name: 'Star Wars', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/star-wars.jpg' },
    { id: 'narnia', name: 'The Chronicles of Narnia', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/narnia.jpg' },
    { id: 'wings-of-fire', name: 'Wings of Fire', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/wings-of-fire.jpg' }
  `;

  // Extract universe images
  const universeMatches = universeData.match(/image: 'https:\/\/d3dp0uoydvg1je\.cloudfront\.net\/universes\/([^']+)'/g);
  universeMatches?.forEach(match => {
    const filename = match.match(/universes\/([^']+)/)[1];
    const name = match.split("name: '")[1]?.split("'")[0] || filename.replace('.jpg', '');
    images.universes.push({
      name,
      filename,
      url: match.split("'")[1],
      category: 'universe',
      prompt: `A book cover style illustration representing the ${name} universe, colorful and appealing to young readers`
    });
  });

  // Interest images
  const interests = [
    'sports', 'animals', 'science_nature', 'history_culture', 'arts_crafts',
    'technology_innovation', 'literature_stories', 'travel_geography',
    'team_sports', 'individual_sports', 'adventure_sports', 'water_sports',
    'winter_sports', 'athletics', 'mind_sports'
  ];

  interests.forEach(interest => {
    const displayName = interest.replace(/_/g, ' & ').replace(/\b\w/g, l => l.toUpperCase());
    images.interests.push({
      name: displayName,
      filename: `${interest}_1024x585.webp`,
      url: `https://d3dp0uoydvg1je.cloudfront.net/interests/${interest}_1024x585.webp`,
      category: 'interest',
      prompt: `An illustration representing ${displayName} in a colorful, child-friendly style suitable for educational content`
    });
  });

  // Character images - sample from the first few
  const characterData = [
    { name: 'Emily Hayes', filename: 'emily-hayes.png', universe: 'Amulet', prompt: 'A young girl character with magical amulet powers, illustrated in a colorful book style' },
    { name: 'Navin Hayes', filename: 'navin-hayes.png', universe: 'Amulet', prompt: 'A young boy character from the Amulet series, illustrated in a colorful book style' },
    { name: 'Miskit', filename: 'miskit.png', universe: 'Amulet', prompt: 'A small rabbit-like creature with pink ears from Amulet series, illustrated in a colorful book style' },
    { name: 'Harry Potter', filename: 'harry-potter.png', universe: 'Harry Potter', prompt: 'A young wizard boy with glasses and messy hair, illustrated in a colorful book style' },
    { name: 'Hermione Granger', filename: 'hermione-granger.png', universe: 'Harry Potter', prompt: 'A young witch girl with bushy brown hair, illustrated in a colorful book style' },
    { name: 'Spider-Man', filename: 'spider-man.png', universe: 'Marvel', prompt: 'Spider-Man superhero in red and blue costume, illustrated in a colorful comic book style' },
    { name: 'Mario', filename: 'mario.png', universe: 'Mario', prompt: 'Mario character in red hat and overalls, illustrated in a colorful cartoon style' },
    { name: 'Pikachu', filename: 'pikachu.png', universe: 'Pokemon', prompt: 'Pikachu yellow electric mouse Pokemon, illustrated in a colorful anime style' }
  ];

  characterData.forEach(char => {
    images.characters.push({
      name: char.name,
      filename: char.filename,
      url: `placeholder-character-url`, // We'll generate these
      category: 'character',
      universe: char.universe,
      prompt: char.prompt
    });
  });

  // Spark images - story starters
  const sparkData = [
    { name: 'The Last Train at Midnight', filename: 'last-train-midnight.png', prompt: 'A mysterious train at a dark station at midnight, illustrated in a dramatic book style' },
    { name: 'Mysterious Map in a Bottle', filename: 'mysterious-map-bottle.png', prompt: 'An old treasure map rolled up inside a glass bottle, illustrated in an adventure book style' },
    { name: 'The Playground Pact', filename: 'playground-pact.png', prompt: 'Children making a secret pact on a school playground, illustrated in a colorful book style' },
    { name: 'A rift opens, releasing strange creatures', filename: 'rift-creatures.png', prompt: 'A magical portal opening with fantastical creatures emerging, illustrated in a fantasy book style' },
    { name: 'The amulet begins to glow', filename: 'amulet-glow.png', prompt: 'A magical amulet glowing with mystical light, illustrated in a fantasy book style' },
    { name: 'Resistance fighters missing', filename: 'fighters-missing.png', prompt: 'Silhouettes of brave fighters in a mysterious landscape, illustrated in an adventure book style' },
    { name: 'Ancient artifact discovered', filename: 'ancient-artifact.png', prompt: 'An ancient mystical artifact being discovered, illustrated in an adventure book style' }
  ];

  sparkData.forEach(spark => {
    images.sparks.push({
      name: spark.name,
      filename: spark.filename,
      url: `placeholder-spark-url`, // We'll generate these
      category: 'spark',
      prompt: spark.prompt
    });
  });

  return images;
}

// Generate the comprehensive image list
const allImages = extractCloudFrontImages();

// Write to JSON file
const outputFile = path.join(__dirname, 'cloudfront-images.json');
fs.writeFileSync(outputFile, JSON.stringify(allImages, null, 2));

console.log(`Extracted ${allImages.universes.length} universe images`);
console.log(`Extracted ${allImages.characters.length} character images`);
console.log(`Extracted ${allImages.sparks.length} spark images`);
console.log(`Extracted ${allImages.interests.length} interest images`);
console.log(`\nTotal: ${Object.values(allImages).flat().length} images`);
console.log(`\nSaved to: ${outputFile}`);

// Generate summary
const summary = {
  totalImages: Object.values(allImages).flat().length,
  byCategory: {
    universes: allImages.universes.length,
    characters: allImages.characters.length,
    sparks: allImages.sparks.length,
    interests: allImages.interests.length
  },
  estimatedCost: Object.values(allImages).flat().length * 0.05 // Approximate cost per image
};

console.log('\nSummary:');
console.log(JSON.stringify(summary, null, 2));
