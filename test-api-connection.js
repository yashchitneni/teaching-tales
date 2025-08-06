// Test script to verify Gemini API connection
// Run with: node test-api-connection.js

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log('🔍 Testing Gemini API Connection...\n');
  
  // Check if API key is set
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.log('❌ GOOGLE_AI_API_KEY not set or still has placeholder value');
    console.log('Please update your .env.local file with your real API key');
    return;
  }
  
  console.log('✅ API key found in environment');
  
  try {
    // Initialize the client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    console.log('🔄 Testing API connection...');
    
    // Test with a simple prompt
    const prompt = "Say 'Hello! Gemini API is working correctly.' in a friendly way.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Connection successful!');
    console.log('📝 Response:', text);
    console.log('\n🎉 Your Gemini API setup is working perfectly!');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Check that your API key is valid and properly set');
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      console.log('💡 You may have hit rate limits - try again in a few minutes');
    } else {
      console.log('💡 Check your internet connection and API key permissions');
    }
  }
}

testConnection();