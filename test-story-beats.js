// Test script for story beat structure validation
// Run with: node test-story-beats.js

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testStoryBeats() {
  console.log('🎭 Testing Story Beat Structure with Gemini Flash...\n');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.log('❌ GOOGLE_AI_API_KEY not set or still has placeholder value');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Test story generation with our enhanced prompt
    const testRequest = {
      universe: 'Harry Potter',
      character: 'Hermione Granger',
      spark: 'discovers a mysterious book in the library that seems to write itself',
      gradeLevel: '4-5',
      studentId: 'test-student'
    };
    
    const prompt = createStoryPromptWithBeats(testRequest);
    
    console.log('📝 Generating story with enhanced beat structure...');
    console.log('Universe:', testRequest.universe);
    console.log('Character:', testRequest.character);
    console.log('Spark:', testRequest.spark);
    console.log('Grade Level:', testRequest.gradeLevel);
    console.log('\\n⏳ Please wait, this may take 30-60 seconds...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('\\n✅ Story generated successfully!');
    console.log('📊 Response length:', text.length, 'characters');
    
    // Try to parse as JSON to validate structure
    try {
      const storyData = parseAIResponse(text);
      console.log('\\n🎯 JSON Structure Validation:');
      console.log('✅ Valid JSON format');
      console.log('📖 Title:', storyData.title);
      console.log('📝 Sections:', storyData.sections?.length || 0);
      console.log('📊 Word Count:', storyData.wordCount);
      console.log('⏱️ Reading Time:', storyData.readingTime);
      
      // Validate story beat structure
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
            const endsWithCliffhanger = section.content.match(/[.!?]\\s*$/);
            const hasExcitement = section.content.match(/[!?]/);
            console.log(`   🎣 Cliffhanger indicators: ${hasExcitement ? '✅' : '⚠️'}`);
          }
          
          // Check for vocabulary words
          const vocabCount = (section.content.match(/class="vocabulary"/g) || []).length;
          console.log(`   📚 Vocabulary words: ${vocabCount}`);
        });
        
        console.log('\\n🎉 Story beat structure validation complete!');
      } else {
        console.log('\\n⚠️ Warning: Expected 5 sections, got', storyData.sections?.length);
      }
      
    } catch (parseError) {
      console.log('\\n❌ JSON Parse Error:', parseError.message);
      console.log('\\n📄 Raw Response (first 500 chars):');
      console.log(text.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.log('\\n❌ Error generating story:', error.message);
    
    if (error.message.includes('rate limit')) {
      console.log('\\n💡 Rate limit hit. Try again in a few minutes.');
    }
  }
}

function createStoryPromptWithBeats(request) {
  return `Generate an educational children's story with the following requirements:

STORY PARAMETERS:
- Universe: ${request.universe}
- Main Character: ${request.character}
- Story Premise: ${request.spark}
- Target Grade Level: ${request.gradeLevel}
- Word Count Target: 800-1200 words

STORY BEAT STRUCTURE:
Create exactly 5 story sections that follow classic narrative structure with compelling cliffhangers:

1. OPENING HOOK (160-240 words): 
   - Establish character, setting, and initial situation
   - End with an intriguing discovery or unexpected event that draws readers in

2. RISING ACTION - PART 1 (160-240 words):
   - Character responds to the hook, begins their journey
   - Introduce the main challenge or mystery
   - End with a complication or obstacle that raises stakes

3. RISING ACTION - PART 2 (160-240 words):
   - Character faces the challenge, learns something important
   - Build tension and develop character growth
   - End with a major revelation or turning point that changes everything

4. CLIMAX & RESOLUTION SETUP (160-240 words):
   - Character confronts the main challenge with new knowledge/skills
   - Show character growth and problem-solving
   - End with the resolution in sight but one final challenge remaining

5. RESOLUTION & NEW BEGINNING (160-240 words):
   - Resolve the main conflict satisfyingly
   - Show character growth and lessons learned
   - End with a sense of completion but hint at future adventures

CLIFFHANGER REQUIREMENTS:
- Each section (except the last) must end with a compelling cliffhanger
- Use techniques like: unexpected discoveries, mysterious events, sudden obstacles, important revelations, or dramatic moments
- Make readers think "I need to know what happens next!"
- Ensure natural story flow between sections

GRADE 4-5 SPECIFIC REQUIREMENTS:
- Use varied sentence lengths and more complex structures
- Include character development and emotional growth
- Character can face moderate challenges requiring problem-solving
- Use past tense primarily with dialogue
- Cliffhangers can include plot twists and character revelations
- Vocabulary can include subject-specific terms and advanced descriptive words

VOCABULARY INTEGRATION:
- Include 3-5 age-appropriate vocabulary words per section
- Mark vocabulary as: <span class="vocabulary" data-word="word" data-definition="definition">word</span>
- Choose words that enhance the story and are appropriate for ${request.gradeLevel}

EDUCATIONAL INTEGRATION:
For each section, create exactly 2 comprehension questions:
- 1 literal comprehension question (what happened in the story?)
- 1 inferential question (why did this happen? what might happen next? how did the character feel?)

OUTPUT FORMAT: 
You must return your response as a valid JSON object with this exact structure:

{
  "title": "An engaging story title that includes the character and adventure",
  "sections": [
    {
      "id": 1,
      "content": "The story text for section 1 goes here...",
      "questions": [
        {
          "id": "q1_1",
          "type": "multiple_choice",
          "question": "What did ${request.character} discover at the beginning of the story?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "This is correct because..."
        },
        {
          "id": "q1_2",
          "type": "multiple_choice",
          "question": "How do you think ${request.character} felt when this happened?",
          "options": ["Excited", "Worried", "Curious", "Confused"],
          "correct": 2,
          "explanation": "The character likely felt curious because..."
        }
      ]
    }
  ],
  "wordCount": 1000,
  "readingTime": "4 minutes",
  "metadata": {
    "universe": "${request.universe}",
    "character": "${request.character}",
    "spark": "${request.spark}",
    "gradeLevel": "${request.gradeLevel}",
    "generatedAt": "ISO timestamp"
  }
}

Important: 
- Ensure the JSON is valid and properly formatted
- Include all 5 sections with 2 questions each
- Make questions engaging and educational
- Keep the story cohesive and engaging throughout all sections
- Each section should build naturally from the previous one
- Cliffhangers should feel organic to the story, not forced`;
}

function parseAIResponse(response) {
  try {
    // First, try parsing as-is
    return JSON.parse(response);
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (innerError) {
        throw new Error(`Failed to parse JSON from code block: ${innerError.message}`);
      }
    }
    
    // Try to find JSON-like content between first { and last }
    const jsonMatch = response.match(/\{[\s\S]*\}/);
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

// Run the test
testStoryBeats().catch(console.error);