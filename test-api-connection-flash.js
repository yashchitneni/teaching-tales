// Test script using Gemini Flash (higher rate limits)
// Run with: node test-api-connection-flash.js

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log('🔍 Testing Gemini Flash API Connection...\n');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.log('❌ GOOGLE_AI_API_KEY not set or still has placeholder value');
    return;
  }
  
  console.log('✅ API key found in environment');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini Flash instead of Pro (higher rate limits)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🔄 Testing API connection with Gemini Flash...');
    
    const prompt = "Say 'Hello! Gemini Flash API is working correctly.' in a friendly way.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Connection successful!');
    console.log('📝 Response:', text);
    console.log('\n🎉 Your Gemini Flash API setup is working perfectly!');
    console.log('💡 Flash has higher rate limits than Pro - good for development');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('429')) {
      console.log('💡 Still hitting rate limits. You might need to:');
      console.log('   - Wait longer (rate limits reset daily)');
      console.log('   - Check if you used the API elsewhere today');
      console.log('   - Consider creating a new API key');
    }
  }
}

testConnection();