// Create a story with properly scored QTI items
// Copy and paste this into your browser console while logged in

async function createScoredStory() {
  console.log('🎯 Creating Story with Properly Scored QTI Items\n');
  
  try {
    // Create a simple story that will generate QTI items with scoring
    const storyRequest = {
      universe: "Educational Adventures",
      character: "Alex the Explorer", 
      spark: "Math Challenge",
      gradeLevel: "3rd Grade",
      studentId: "test-student-" + Date.now(),
      storyLength: "short",
      educationalGoals: ["Basic arithmetic", "Problem solving"],
      customizations: {
        includeQuiz: true,
        difficultyLevel: "beginner",
        questionTypes: ["multiple-choice"],
        scoringEnabled: true  // This should trigger proper scoring metadata
      }
    };
    
    console.log('📝 Generating story with scoring enabled...');
    
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(storyRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Story generation failed: ${response.status}`, errorText);
      return;
    }
    
    const storyData = await response.json();
    console.log('✅ Story generated successfully!');
    console.log('📊 Story data:', storyData);
    
    // Extract any QTI item IDs from the response
    const qtiItems = [];
    
    // Look for QTI items in various places in the response
    if (storyData.chapters) {
      storyData.chapters.forEach((chapter, chapterIndex) => {
        if (chapter.quiz && chapter.quiz.items) {
          chapter.quiz.items.forEach((item, itemIndex) => {
            if (item.id || item.identifier) {
              qtiItems.push({
                id: item.id || item.identifier,
                title: item.title || `Chapter ${chapterIndex + 1} Question ${itemIndex + 1}`,
                chapter: chapterIndex + 1
              });
            }
          });
        }
      });
    }
    
    if (storyData.quiz && storyData.quiz.items) {
      storyData.quiz.items.forEach((item, itemIndex) => {
        if (item.id || item.identifier) {
          qtiItems.push({
            id: item.id || item.identifier,
            title: item.title || `Quiz Question ${itemIndex + 1}`,
            chapter: 'final'
          });
        }
      });
    }
    
    if (qtiItems.length === 0) {
      console.log('ℹ️ No QTI items found in story response. Let\\'s check the structure:');
      console.log('Available keys:', Object.keys(storyData));
      
      // Try to find any ID-like fields
      const findIds = (obj, path = '') => {
        const ids = [];
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && (key.includes('id') || key.includes('Id')) && value.length > 10) {
            ids.push({ path: path + key, value });
          } else if (typeof value === 'object' && value !== null) {
            ids.push(...findIds(value, path + key + '.'));
          }
        }
        return ids;
      };
      
      const foundIds = findIds(storyData);
      console.log('Found potential item IDs:', foundIds);
      
      if (foundIds.length > 0) {
        // Test the first ID we found
        const testId = foundIds[0].value;
        console.log(`\\n🧪 Testing ID: ${testId}`);
        await testItemScoring(testId);
      }
      
      return;
    }
    
    console.log(`\\n🎯 Found ${qtiItems.length} QTI items to test:`);
    qtiItems.forEach(item => {
      console.log(`  - ${item.id} (${item.title})`);
    });
    
    // Test each item for proper scoring
    console.log('\\n🧪 Testing Scoring for Each Item:');
    
    for (const item of qtiItems) {
      await testItemScoring(item.id, item.title);
    }
    
  } catch (error) {
    console.error('❌ Error creating scored story:', error);
  }
}

async function testItemScoring(itemId, title = '') {
  try {
    console.log(`\\n📋 Testing item: ${itemId} ${title ? '(' + title + ')' : ''}`);
    console.log('─'.repeat(50));
    
    // First get item details
    const itemResponse = await fetch(`/api/ims/qti/v3p0/assessment-items/${itemId}`, {
      credentials: 'include'
    });
    
    if (!itemResponse.ok) {
      console.log(`❌ Failed to fetch item: ${itemResponse.status}`);
      return;
    }
    
    const itemData = await itemResponse.json();
    const item = itemData.data?.item || itemData.item || itemData;
    
    // Check scoring metadata
    const hasResponseDecl = item.responseDeclarations?.[0]?.correctResponse?.values?.length > 0;
    const hasTemplate = !!item.responseProcessingTemplate;
    const hasOutcomes = item.outcomeDeclarations?.length > 0;
    
    console.log(`🎯 Scoring Analysis:`);
    console.log(`   Response Declaration: ${hasResponseDecl ? '✅' : '❌'}`);
    console.log(`   Processing Template: ${hasTemplate ? '✅ ' + item.responseProcessingTemplate : '❌'}`);
    console.log(`   Outcome Declarations: ${hasOutcomes ? '✅ (' + item.outcomeDeclarations.length + ')' : '❌'}`);
    
    // Test correct answer
    const testResponse = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        responses: { RESPONSE: 'choice_A' },
        attemptId: 'test-correct-' + Date.now()
      })
    });
    
    if (testResponse.ok) {
      const result = await testResponse.json();
      const score = result.data?.score ?? result.score ?? 0;
      const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
      
      console.log(`📊 Test Result (choice_A): ${score}/${maxScore}`);
      
      if (score > 0 && maxScore > 0) {
        console.log(`🎉 SUCCESS: Item has working scoring!`);
        
        // Test wrong answer too
        const wrongResponse = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            responses: { RESPONSE: 'choice_B' },
            attemptId: 'test-wrong-' + Date.now()
          })
        });
        
        if (wrongResponse.ok) {
          const wrongResult = await wrongResponse.json();
          const wrongScore = wrongResult.data?.score ?? wrongResult.score ?? 0;
          console.log(`📊 Wrong Answer Test (choice_B): ${wrongScore}/${maxScore}`);
          
          if (wrongScore === 0) {
            console.log(`✨ PERFECT: Correct scoring for both right and wrong answers!`);
          }
        }
      } else {
        console.log(`❌ PROBLEM: Item still returns 0/0 - scoring metadata missing`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing item ${itemId}:`, error);
  }
}

// Run it
createScoredStory();
