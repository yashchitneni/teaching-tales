// Improved story beat structure test with better error handling
// Run with: node test-story-beats-improved.js

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testStoryBeatsImproved() {
  console.log('🎭 Testing Improved Story Beat Structure...\n');
  
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
        maxOutputTokens: 4000,
      }
    });
    
    const testRequest = {
      universe: 'Pokemon',
      character: 'Pikachu', 
      spark: 'finds a glowing crystal in the forest',
      gradeLevel: '2-3'
    };
    
    const prompt = createImprovedStoryPrompt(testRequest);
    
    console.log('📝 Generating story with beat structure...');
    console.log('Universe:', testRequest.universe);
    console.log('Character:', testRequest.character);
    console.log('Spark:', testRequest.spark);
    console.log('Grade Level:', testRequest.gradeLevel);
    console.log('\\n⏳ Please wait...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    console.log('\\n✅ Story generated successfully!');
    console.log('📊 Response length:', text.length, 'characters');
    
    // Save raw response for debugging
    require('fs').writeFileSync('debug-story-response.json', text);
    console.log('💾 Raw response saved to debug-story-response.json');
    
    // Test parsing
    try {
      const storyData = parseAIResponse(text);
      console.log('\\n🎯 JSON Structure Validation:');
      console.log('✅ Valid JSON format');
      console.log('📖 Title:', storyData.title);
      console.log('📝 Sections:', storyData.sections?.length || 0);
      console.log('📊 Word Count:', storyData.wordCount);
      console.log('⏱️ Reading Time:', storyData.readingTime);
      
      if (storyData.sections && storyData.sections.length === 5) {
        console.log('\\n🎭 Story Beat Analysis:');
        storyData.sections.forEach((section, index) => {
          const beatNames = [
            'Opening Hook',
            'Rising Action - Part 1', 
            'Rising Action - Part 2',
            'Climax & Resolution Setup',
            'Resolution & New Beginning'
          ];
          
          console.log(`\\n${index + 1}. ${beatNames[index]}:`);
          console.log(`   📝 Length: ${section.content.length} characters`);
          console.log(`   ❓ Questions: ${section.questions?.length || 0}`);
          
          // Check for cliffhanger (except last section)
          if (index < 4) {
            const hasExcitement = section.content.match(/[!?]/);
            console.log(`   🎣 Cliffhanger indicators: ${hasExcitement ? '✅' : '⚠️'}`);
          }
          
          // Show content preview
          const preview = section.content.replace(/<[^>]*>/g, '').substring(0, 100);
          console.log(`   📖 Preview: "${preview}..."`);
        });
        
        console.log('\\n🎉 Story beat structure validation complete!');
      } else {
        console.log('\\n⚠️ Warning: Expected 5 sections, got', storyData.sections?.length);
      }
      
    } catch (parseError) {
      console.log('\\n❌ JSON Parse Error:', parseError.message);
      
      // Enhanced debugging
      console.log('\\n🔍 Debugging JSON Issues:');
      console.log('Response starts with:', text.substring(0, 50));
      console.log('Response ends with:', text.substring(text.length - 50));
      
      // Try to identify the specific JSON error location
      const lines = text.split('\\n');
      console.log('\\n📄 Response structure:');
      lines.slice(0, 10).forEach((line, i) => {
        console.log(`${i + 1}: ${line}`);
      });
      
      if (lines.length > 20) {
        console.log('... (truncated) ...');
        lines.slice(-5).forEach((line, i) => {
          console.log(`${lines.length - 5 + i + 1}: ${line}`);
        });
      }
    }
    
  } catch (error) {
    console.log('\\n❌ Error generating story:', error.message);
  }
}

function createImprovedStoryPrompt(request) {
  return `Generate an educational children's story with these exact requirements:

STORY PARAMETERS:
- Universe: ${request.universe}
- Main Character: ${request.character}
- Story Premise: ${request.spark}
- Target Grade Level: ${request.gradeLevel}

STORY STRUCTURE:
Create exactly 5 sections with compelling story beats:

1. OPENING HOOK (120-180 words): Establish character and setting, end with discovery
2. RISING ACTION 1 (120-180 words): Character responds to discovery, introduce challenge
3. RISING ACTION 2 (120-180 words): Face challenge, learn something important, revelation
4. CLIMAX SETUP (120-180 words): Confront challenge with new knowledge, final obstacle
5. RESOLUTION (120-180 words): Resolve conflict, show growth, hint at future

GRADE 2-3 REQUIREMENTS:
- Use simple sentences (10-15 words each)
- Include descriptive words and adjectives  
- Character faces mild challenges and solves simple problems
- Mix present and past tense
- Cliffhangers should be discoveries or small obstacles, not scary

JSON OUTPUT FORMAT:
Return ONLY this JSON structure with NO markdown formatting or code blocks:

{
  "title": "Story Title",
  "sections": [
    {
      "id": 1,
      "content": "Story text here without line breaks inside the string",
      "questions": [
        {
          "id": "q1_1",
          "type": "multiple_choice", 
          "question": "What did the character find?",
          "options": ["A crystal", "A flower", "A friend", "A path"],
          "correct": 0,
          "explanation": "The character found a crystal"
        },
        {
          "id": "q1_2",
          "type": "multiple_choice",
          "question": "How did the character feel?",
          "options": ["Happy", "Scared", "Curious", "Tired"],
          "correct": 2,
          "explanation": "The character felt curious"
        }
      ]
    }
  ],
  "wordCount": 800,
  "readingTime": "3 minutes"
}

CRITICAL: 
- Return ONLY the JSON object
- No markdown, no code blocks, no extra text
- Use proper JSON formatting with double quotes
- Escape any quotes inside strings with backslash
- Keep content as single-line strings (no line breaks inside strings)`;
}

function parseAIResponse(response) {
  try {
    return JSON.parse(response);
  } catch (error) {
    // Try to extract from code blocks
    const codeBlockMatch = response.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (innerError) {
        throw new Error(`Code block JSON error: ${innerError.message}`);
      }
    }
    
    // Try to find JSON between braces
    const jsonMatch = response.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error(`Extracted JSON error: ${innerError.message}`);
      }
    }
    
    throw new Error(`No valid JSON found: ${error.message}`);
  }
}

testStoryBeatsImproved().catch(console.error);