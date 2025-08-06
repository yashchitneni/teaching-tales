// Simple story generation test to validate JSON parsing
// Run with: node test-simple-story.js

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSimpleStory() {
  console.log('🧪 Testing Simple Story Generation...\n');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.log('❌ GOOGLE_AI_API_KEY not set');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });
    
    const prompt = `Create a simple JSON object for a children's story with this exact format:

{
  "title": "Story Title Here",
  "content": "A short story about a character finding something magical.",
  "wordCount": 50
}

Requirements:
- Return ONLY the JSON object
- No markdown code blocks or extra text
- Use proper JSON formatting with double quotes
- Keep the story content under 100 words`;
    
    console.log('📝 Generating simple story...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    console.log('✅ Response received');
    console.log('📊 Length:', text.length, 'characters');
    console.log('\\n📄 Raw Response:');
    console.log(text);
    
    // Test our parser
    try {
      const parsed = parseAIResponse(text);
      console.log('\\n🎯 Parsed Successfully:');
      console.log('Title:', parsed.title);
      console.log('Word Count:', parsed.wordCount);
      console.log('Content Preview:', parsed.content.substring(0, 100) + '...');
      
    } catch (parseError) {
      console.log('\\n❌ Parse Error:', parseError.message);
      
      // Try to identify the issue
      console.log('\\n🔍 Debugging Info:');
      console.log('Starts with {:', text.startsWith('{'));
      console.log('Ends with }:', text.endsWith('}'));
      console.log('Has code block:', text.includes('```'));
      
      // Show problematic area
      const lines = text.split('\\n');
      console.log('\\n📄 Line by line:');
      lines.forEach((line, i) => {
        console.log(`${i + 1}: ${line}`);
      });
    }
    
  } catch (error) {
    console.log('\\n❌ Generation Error:', error.message);
  }
}

function parseAIResponse(response) {
  try {
    // First, try parsing as-is
    return JSON.parse(response);
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks
    const codeBlockMatch = response.match(/```(?:json)?\\s*([\\s\\S]*?)\\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (innerError) {
        throw new Error(`Failed to parse JSON from code block: ${innerError.message}`);
      }
    }
    
    // Try to find JSON-like content between first { and last }
    const jsonMatch = response.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error(`Failed to parse extracted JSON: ${innerError.message}`);
      }
    }
    
    throw new Error(`No valid JSON found in response: ${error.message}`);
  }
}

testSimpleStory().catch(console.error);