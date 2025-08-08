#!/usr/bin/env node

/**
 * Test QTI scoring with the new properly configured items
 * This verifies that our fixes work end-to-end
 */

async function testQTIScoring() {
  console.log('🧪 Testing QTI Scoring End-to-End\n');
  
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:3001';
    
    // Check authentication
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      console.error('❌ Not authenticated. Please log in first.');
      console.log('Run this in your browser console or ensure you\'re logged in.');
      return;
    }
    
    console.log('✅ Authenticated successfully');
    
    // Get list of recent items to find our test items
    console.log('\n📋 Finding test items...');
    
    const itemsResponse = await fetch('/api/ims/qti/v3p0/assessment-items?limit=10', {
      credentials: 'include'
    });
    
    if (!itemsResponse.ok) {
      console.error('❌ Failed to fetch items list');
      return;
    }
    
    const itemsData = await itemsResponse.json();
    const items = itemsData.data?.items || itemsData.items || [];
    
    // Find items created by our generator
    const testItems = items.filter(item => 
      item.identifier?.startsWith('sample_') || 
      item.metadata?.purpose === 'scoring-test'
    );
    
    if (testItems.length === 0) {
      console.log('⚠️  No test items found. Run generate-scored-items.js first.');
      return;
    }
    
    console.log(`✅ Found ${testItems.length} test items`);
    
    // Test each item
    for (const item of testItems.slice(0, 2)) { // Test first 2
      console.log(`\n🎯 Testing item: ${item.title || item.identifier}`);
      console.log('─'.repeat(50));
      
      // Determine correct and incorrect answers based on item type
      let correctAnswer, incorrectAnswer;
      
      if (item.identifier?.includes('choice')) {
        correctAnswer = 'choice_A';
        incorrectAnswer = 'choice_B';
      } else if (item.identifier?.includes('text')) {
        correctAnswer = 'Austin';
        incorrectAnswer = 'Houston';
      } else {
        // Try to determine from item details
        console.log('🔍 Analyzing item structure...');
        
        const detailResponse = await fetch(`/api/ims/qti/v3p0/assessment-items/${item.id}`, {
          credentials: 'include'
        });
        
        if (detailResponse.ok) {
          const details = await detailResponse.json();
          const itemDetail = details.data?.item || details.item || details;
          
          if (itemDetail.responseDeclarations?.[0]?.correctResponse?.values?.[0]) {
            correctAnswer = itemDetail.responseDeclarations[0].correctResponse.values[0];
            
            // Guess an incorrect answer
            if (correctAnswer === 'choice_A') {
              incorrectAnswer = 'choice_B';
            } else if (correctAnswer === 'Austin') {
              incorrectAnswer = 'Houston';
            } else {
              incorrectAnswer = 'wrong_answer';
            }
          }
        }
        
        if (!correctAnswer) {
          console.log('⚠️  Could not determine correct answer, skipping');
          continue;
        }
      }
      
      console.log(`   Correct answer: "${correctAnswer}"`);
      console.log(`   Incorrect answer: "${incorrectAnswer}"`);
      
      // Test correct answer
      console.log('\n   Testing CORRECT answer:');
      try {
        const correctResponse = await fetch(`/api/ims/qti/v3p0/items/${item.id}/process-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            responses: {
              RESPONSE: correctAnswer
            },
            attemptId: `test-correct-${Date.now()}`
          })
        });
        
        if (correctResponse.ok) {
          const result = await correctResponse.json();
          const score = result.data?.score ?? result.score ?? 0;
          const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
          const isCorrect = result.data?.isCorrect ?? result.isCorrect ?? false;
          
          console.log(`     📊 Score: ${score}/${maxScore}`);
          console.log(`     ✓ Is Correct: ${isCorrect}`);
          
          if (score === maxScore && maxScore > 0 && isCorrect) {
            console.log(`     🎉 SUCCESS! Correct answer scored properly.`);
          } else {
            console.log(`     ❌ FAILED! Expected score=${maxScore}, isCorrect=true`);
            console.log(`     📄 Full response:`, JSON.stringify(result, null, 2));
          }
        } else {
          console.log(`     ❌ Request failed: ${correctResponse.status}`);
          const error = await correctResponse.text();
          console.log(`     Error: ${error}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
      
      // Test incorrect answer
      console.log('\n   Testing INCORRECT answer:');
      try {
        const incorrectResponse = await fetch(`/api/ims/qti/v3p0/items/${item.id}/process-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            responses: {
              RESPONSE: incorrectAnswer
            },
            attemptId: `test-incorrect-${Date.now()}`
          })
        });
        
        if (incorrectResponse.ok) {
          const result = await incorrectResponse.json();
          const score = result.data?.score ?? result.score ?? 0;
          const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
          const isCorrect = result.data?.isCorrect ?? result.isCorrect ?? false;
          
          console.log(`     📊 Score: ${score}/${maxScore}`);
          console.log(`     ✓ Is Correct: ${isCorrect}`);
          
          if (score === 0 && maxScore > 0 && !isCorrect) {
            console.log(`     🎉 SUCCESS! Incorrect answer scored properly.`);
          } else {
            console.log(`     ❌ FAILED! Expected score=0, isCorrect=false`);
            console.log(`     📄 Full response:`, JSON.stringify(result, null, 2));
          }
        } else {
          console.log(`     ❌ Request failed: ${incorrectResponse.status}`);
          const error = await incorrectResponse.text();
          console.log(`     Error: ${error}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n🏁 Testing Complete!');
    console.log('\nIf you see "SUCCESS!" messages above, the QTI scoring is working correctly.');
    console.log('You can now use these properly scored items in your applications.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testQTIScoring().catch(console.error);
}

module.exports = { testQTIScoring };
