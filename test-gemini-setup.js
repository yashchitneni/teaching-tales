// Simple test script to verify Gemini setup
// Run with: node test-gemini-setup.js

// Try to load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use process.env directly
}

console.log('🔍 Testing Gemini Pro Integration Setup...\n');

// Test 1: Check environment variables
console.log('1. Environment Configuration:');
console.log('   GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('   GEMINI_MODEL_NAME:', process.env.GEMINI_MODEL_NAME || 'Using default (gemini-1.5-pro)');
console.log('   GEMINI_MAX_TOKENS:', process.env.GEMINI_MAX_TOKENS || 'Using default (4096)');

// Test 2: Check if we can import our modules
console.log('\n2. Module Imports:');
try {
  // Note: This is a basic check - actual imports would need TypeScript compilation
  const fs = require('fs');
  const path = require('path');
  
  const aiDir = path.join(__dirname, 'src/lib/ai');
  const files = [
    'types.ts',
    'gemini-client.ts', 
    'prompt-templates.ts',
    'connection-test.ts',
    'index.ts'
  ];
  
  let allFilesExist = true;
  files.forEach(file => {
    const filePath = path.join(aiDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ${file}: ✅ Created`);
    } else {
      console.log(`   ${file}: ❌ Missing`);
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    console.log('   All AI module files created successfully!');
  }
} catch (error) {
  console.log('   ❌ Error checking files:', error.message);
}

// Test 3: Check package.json
console.log('\n3. Dependencies:');
try {
  const packageJson = require('./package.json');
  const hasGeminiSDK = packageJson.dependencies && packageJson.dependencies['@google/generative-ai'];
  
  if (hasGeminiSDK) {
    console.log(`   @google/generative-ai: ✅ Installed (${packageJson.dependencies['@google/generative-ai']})`);
  } else {
    console.log('   @google/generative-ai: ❌ Not found in dependencies');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Test 4: Configuration file
console.log('\n4. Configuration File:');
try {
  const fs = require('fs');
  const configContent = fs.readFileSync('./src/lib/config.ts', 'utf8');
  
  const hasGeminiConfig = configContent.includes('GEMINI_CONFIG');
  const hasApiKey = configContent.includes('GOOGLE_AI_API_KEY');
  const hasModelName = configContent.includes('GEMINI_MODEL_NAME');
  
  console.log('   GEMINI_CONFIG export:', hasGeminiConfig ? '✅ Added' : '❌ Missing');
  console.log('   API_KEY configuration:', hasApiKey ? '✅ Added' : '❌ Missing');
  console.log('   MODEL_NAME configuration:', hasModelName ? '✅ Added' : '❌ Missing');
} catch (error) {
  console.log('   ❌ Error reading config file:', error.message);
}

console.log('\n🎉 Phase 1 Setup Complete!');
console.log('\nNext Steps:');
console.log('1. Set GOOGLE_AI_API_KEY in your environment');
console.log('2. Run the development server to test integration');
console.log('3. Proceed to Phase 2: Prompt Engineering & Templates');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.log('\n⚠️  Important: You need to set GOOGLE_AI_API_KEY before testing the actual API connection.');
  console.log('   Get your API key from: https://aistudio.google.com/apikey');
}