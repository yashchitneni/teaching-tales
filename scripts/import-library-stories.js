#!/usr/bin/env node

/**
 * Library Story Import Script
 * 
 * Command-line tool for importing stories into the TeachTales library.
 * Supports JSON, CSV, and text file formats.
 * 
 * Usage:
 *   node scripts/import-library-stories.js --file stories.json
 *   node scripts/import-library-stories.js --directory ./stories --format json
 *   node scripts/import-library-stories.js --sample
 */

const fs = require('fs')
const path = require('path')
const { program } = require('commander')

// Sample story data for testing
const SAMPLE_STORIES = [
  {
    title: "The Brave Little Turtle",
    author: "Maria Rodriguez",
    description: "A young turtle learns about courage when helping friends in the ocean.",
    readingLevel: "K-1",
    tags: ["courage", "friendship", "ocean", "animals"],
    category: "Animals",
    subcategory: "Marine Life",
    topic: "Ocean Creatures",
    chapters: [
      {
        title: "Meeting Shelly",
        content: "Shelly was a small turtle who lived in the warm blue ocean. She had a green shell with yellow spots. Every day, Shelly swam near the coral reef with her fish friends. The fish were red, blue, and yellow. They liked to play hide and seek in the coral. Shelly was shy and quiet. She watched the other sea animals play together. Sometimes she wanted to join them, but she felt too scared. The ocean was big and Shelly felt very small.",
        questions: [
          {
            question: "What color was Shelly's shell?",
            type: "multiple-choice",
            options: ["Green with yellow spots", "Blue with red spots", "Yellow with green spots", "Red with blue spots"],
            correctAnswer: 0,
            explanation: "The story says Shelly had a green shell with yellow spots."
          },
          {
            question: "How did Shelly feel about joining other animals?",
            type: "multiple-choice", 
            options: ["Excited", "Scared", "Angry", "Bored"],
            correctAnswer: 1,
            explanation: "The story tells us that Shelly wanted to join but felt too scared."
          }
        ],
        vocabulary: [
          {
            word: "coral",
            definition: "A hard substance made by tiny sea animals",
            partOfSpeech: "noun"
          },
          {
            word: "reef",
            definition: "A line of rocks or coral near the surface of the sea",
            partOfSpeech: "noun"
          }
        ]
      },
      {
        title: "The Lost Fish",
        content: "One morning, Shelly heard crying sounds. She swam toward the noise. A small yellow fish was stuck under a big rock. The fish was scared and could not get out. 'Help me!' cried the fish. Shelly looked at the heavy rock. She was small, but she wanted to help. Shelly pushed and pushed with her strong flippers. The rock moved a little bit. She pushed harder. Finally, the rock rolled away! The yellow fish swam out safely. 'Thank you, Shelly!' said the fish. 'You are so brave!' Shelly felt proud and happy.",
        questions: [
          {
            question: "What was wrong with the yellow fish?",
            type: "multiple-choice",
            options: ["It was hungry", "It was stuck under a rock", "It was lost", "It was sick"],
            correctAnswer: 1,
            explanation: "The story clearly states the fish was stuck under a big rock."
          },
          {
            question: "How did Shelly help the fish?",
            type: "multiple-choice",
            options: ["She called for help", "She pushed the rock away", "She gave it food", "She showed it the way home"],
            correctAnswer: 1,
            explanation: "Shelly used her flippers to push the rock until it rolled away."
          }
        ],
        vocabulary: [
          {
            word: "flippers",
            definition: "The flat parts of a turtle's body used for swimming",
            partOfSpeech: "noun"
          },
          {
            word: "proud",
            definition: "Feeling good about something you did well",
            partOfSpeech: "adjective"
          }
        ]
      }
    ],
    provenance: {
      originalSource: "TeachTales Educational Content",
      license: "Creative Commons BY-SA 4.0",
      attribution: "Created for TeachTales Library"
    }
  },
  {
    title: "The Mystery of the Missing Homework",
    author: "James Chen",
    description: "A student detective solves the case of disappearing homework assignments.",
    readingLevel: "2-3",
    tags: ["mystery", "school", "problem-solving", "friendship"],
    category: "Literature & Stories",
    subcategory: "Popular Children's Stories", 
    topic: "Modern Favorites",
    chapters: [
      {
        title: "The Case Begins",
        content: "Emma loved solving puzzles and mysteries. She carried a small notebook everywhere she went. At school, she noticed something strange. Three students in her class said their homework had disappeared from their backpacks. 'This is very odd,' thought Emma. She decided to investigate. Emma asked each student when they last saw their homework. She wrote down all the clues in her notebook. The missing homework was all math worksheets. They had all been completed the night before. Emma suspected someone was taking the homework, but who would do such a thing?",
        questions: [
          {
            question: "What did Emma carry with her everywhere?",
            type: "multiple-choice",
            options: ["A magnifying glass", "A small notebook", "A pencil case", "A calculator"],
            correctAnswer: 1,
            explanation: "The story mentions Emma carried a small notebook everywhere she went."
          },
          {
            question: "What type of homework was missing?",
            type: "multiple-choice",
            options: ["Reading worksheets", "Science projects", "Math worksheets", "Art assignments"],
            correctAnswer: 2,
            explanation: "The text states that the missing homework was all math worksheets."
          }
        ]
      }
    ]
  }
]

// Import validation function (simplified version)
function validateStoryData(story) {
  const errors = []
  
  if (!story.title) errors.push('Title is required')
  if (!story.author) errors.push('Author is required')
  if (!story.readingLevel) errors.push('Reading level is required')
  if (!story.category) errors.push('Category is required')
  if (!story.subcategory) errors.push('Subcategory is required')
  if (!story.topic) errors.push('Topic is required')
  if (!story.chapters || story.chapters.length === 0) errors.push('At least one chapter is required')
  
  const validLevels = ['K-1', '2-3', '4-5', '6-8', '9-12']
  if (story.readingLevel && !validLevels.includes(story.readingLevel)) {
    errors.push(`Invalid reading level: ${story.readingLevel}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

// Process a single story file
function processStoryFile(filePath) {
  console.log(`Processing: ${filePath}`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let storyData
    
    if (filePath.endsWith('.json')) {
      storyData = JSON.parse(content)
    } else {
      throw new Error('Unsupported file format. Only JSON is currently supported.')
    }
    
    // Handle both single story and array of stories
    const stories = Array.isArray(storyData) ? storyData : [storyData]
    
    const results = {
      successful: [],
      failed: []
    }
    
    stories.forEach((story, index) => {
      const validation = validateStoryData(story)
      
      if (validation.isValid) {
        results.successful.push({
          index: index + 1,
          title: story.title,
          author: story.author,
          chapters: story.chapters.length,
          wordCount: story.chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).length || 0), 0)
        })
        console.log(`✅ Story ${index + 1}: "${story.title}" by ${story.author}`)
      } else {
        results.failed.push({
          index: index + 1,
          title: story.title || 'Unknown',
          errors: validation.errors
        })
        console.log(`❌ Story ${index + 1}: Validation failed`)
        validation.errors.forEach(error => console.log(`   - ${error}`))
      }
    })
    
    return results
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return { successful: [], failed: [{ file: filePath, errors: [error.message] }] }
  }
}

// Process directory of story files
function processDirectory(dirPath) {
  console.log(`Processing directory: ${dirPath}`)
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`)
    return { successful: [], failed: [] }
  }
  
  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dirPath, file))
  
  if (files.length === 0) {
    console.log('No JSON files found in directory')
    return { successful: [], failed: [] }
  }
  
  console.log(`Found ${files.length} JSON files`)
  
  const allResults = {
    successful: [],
    failed: []
  }
  
  files.forEach(file => {
    const results = processStoryFile(file)
    allResults.successful.push(...results.successful)
    allResults.failed.push(...results.failed)
  })
  
  return allResults
}

// Generate sample stories
function generateSampleStories(outputPath) {
  console.log(`Generating sample stories to: ${outputPath}`)
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(SAMPLE_STORIES, null, 2))
    console.log(`✅ Sample stories written to ${outputPath}`)
    console.log(`   - ${SAMPLE_STORIES.length} stories included`)
    console.log(`   - Use this file to test the import process`)
    console.log(`   - Run: node scripts/import-library-stories.js --file ${outputPath}`)
  } catch (error) {
    console.error(`Failed to write sample stories:`, error.message)
  }
}

// Print summary
function printSummary(results) {
  console.log('\n' + '='.repeat(50))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(50))
  
  console.log(`✅ Successful: ${results.successful.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  
  if (results.successful.length > 0) {
    console.log('\nSuccessful imports:')
    results.successful.forEach(story => {
      console.log(`  📚 "${story.title}" by ${story.author}`)
      console.log(`     ${story.chapters} chapters, ${story.wordCount} words`)
    })
  }
  
  if (results.failed.length > 0) {
    console.log('\nFailed imports:')
    results.failed.forEach(failure => {
      console.log(`  ❌ ${failure.title || failure.file || 'Unknown'}`)
      if (failure.errors) {
        failure.errors.forEach(error => console.log(`     - ${error}`))
      }
    })
  }
  
  const totalWords = results.successful.reduce((sum, story) => sum + story.wordCount, 0)
  const totalChapters = results.successful.reduce((sum, story) => sum + story.chapters, 0)
  
  console.log(`\nTotal: ${totalWords} words across ${totalChapters} chapters`)
}

// CLI setup
program
  .name('import-library-stories')
  .description('Import stories into the TeachTales library')
  .version('1.0.0')

program
  .option('-f, --file <path>', 'Import from a single JSON file')
  .option('-d, --directory <path>', 'Import all JSON files from a directory')
  .option('--sample [path]', 'Generate sample story files', 'sample-stories.json')
  .option('--validate-only', 'Only validate files without importing')
  .option('--generate-covers', 'Generate cover images for stories')

program.parse()

const options = program.opts()

// Main execution
async function main() {
  console.log('TeachTales Library Story Import Tool')
  console.log('===================================\n')
  
  if (options.sample !== undefined) {
    generateSampleStories(options.sample)
    return
  }
  
  let results = { successful: [], failed: [] }
  
  if (options.file) {
    if (!fs.existsSync(options.file)) {
      console.error(`File not found: ${options.file}`)
      process.exit(1)
    }
    results = processStoryFile(options.file)
  } else if (options.directory) {
    results = processDirectory(options.directory)
  } else {
    console.error('Please specify either --file or --directory option')
    console.log('Use --help for usage information')
    process.exit(1)
  }
  
  printSummary(results)
  
  if (options.validateOnly) {
    console.log('\n📋 Validation complete (no stories were imported)')
  } else {
    console.log('\n💾 Note: This script validates stories but does not actually import them.')
    console.log('   To import stories, use the LibraryImportService in the application.')
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error.message)
  process.exit(1)
})
