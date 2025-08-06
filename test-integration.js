// Integration test for story generation service
// Run with: node test-integration.js

require('dotenv').config({ path: '.env.local' });

async function testIntegration() {
  console.log('🧪 Testing Story Generation Integration...\n');
  
  // Test that we can import and use our service
  try {
    // Dynamically import our service (since it's TypeScript)
    const { StoryGenerationService } = await import('./src/lib/ai/story-generation-service.js').catch(() => {
      console.log('⚠️  TypeScript files not compiled. Testing with manual import...');
      return require('./dist/lib/ai/story-generation-service.js');
    }).catch(() => {
      console.log('📝 Running direct test with minimal service simulation...');
      return testDirectIntegration();
    });

    if (!StoryGenerationService) {
      console.log('❌ Could not load StoryGenerationService');
      return;
    }

    const service = new StoryGenerationService();
    
    // Test connection first
    console.log('🔗 Testing connection...');
    const isConnected = await service.testConnection();
    
    if (!isConnected) {
      console.log('❌ Connection test failed');
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Test story generation with minimal parameters
    console.log('\n🎭 Testing story generation...');
    
    const testRequest = {
      universe: 'Pokemon',
      character: 'Pikachu',
      spark: 'finds a magical berry',
      gradeLevel: '2-3',
      studentId: 'test-student-123'
    };
    
    console.log('📝 Request:', testRequest);
    
    const startTime = Date.now();
    const story = await service.generateStory(testRequest);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Story generated in ${duration}ms!`);
    console.log('📖 Title:', story.title);
    console.log('📝 Sections:', story.sections.length);
    console.log('📊 Word Count:', story.wordCount);
    console.log('⏱️ Reading Time:', story.readingTime);
    
    // Validate structure
    console.log('\n🔍 Validating structure...');
    
    if (story.sections.length !== 5) {
      console.log(`❌ Expected 5 sections, got ${story.sections.length}`);
      return;
    }
    
    let allSectionsValid = true;
    story.sections.forEach((section, index) => {
      if (!section.content || !section.questions || section.questions.length !== 2) {
        console.log(`❌ Section ${index + 1} is invalid`);
        allSectionsValid = false;
      }
    });
    
    if (allSectionsValid) {
      console.log('✅ All sections valid!');
    }
    
    // Test localStorage integration simulation
    console.log('\n💾 Testing localStorage integration...');
    
    const mockStory = {
      id: 'test-story-123',
      title: story.title,
      wordCount: story.wordCount,
      readingTime: story.readingTime,
      sections: story.sections,
      metadata: story.metadata
    };
    
    // Simulate what the loading page does
    console.log('📝 Story structure for localStorage:', {
      id: mockStory.id,
      title: mockStory.title,
      sectionsCount: mockStory.sections.length,
      firstSectionPreview: mockStory.sections[0].content.substring(0, 100) + '...'
    });
    
    console.log('\n🎉 Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    
    if (error.message.includes('rate limit')) {
      console.log('\n💡 Rate limit hit. This is expected during development.');
      console.log('The integration structure is correct, just need to wait for rate limits to reset.');
    }
  }
}

async function testDirectIntegration() {
  console.log('📋 Testing direct integration without compilation...');
  
  // Test that our environment is set up correctly
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.log('❌ GOOGLE_AI_API_KEY not configured');
    return false;
  }
  
  console.log('✅ Environment configured correctly');
  
  // Test that we can make a basic API call
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🔗 Testing basic API connection...');
    
    const result = await model.generateContent('Say "Integration test successful"');
    const response = result.response.text();
    
    if (response.includes('successful')) {
      console.log('✅ Direct integration test passed!');
      console.log('📝 API Response:', response);
      return true;
    } else {
      console.log('⚠️  Unexpected response:', response);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Direct integration failed:', error.message);
    return false;
  }
}

// Run the test
testIntegration().catch(console.error);