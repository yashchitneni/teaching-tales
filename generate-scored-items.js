#!/usr/bin/env node

/**
 * Generate properly scored QTI items to replace the unscored ones
 * This creates items with correct response metadata and MATCH_CORRECT template
 */

const BASE_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

// Sample QTI items with proper scoring
const SAMPLE_ITEMS = [
  {
    identifier: 'sample_choice_item_001',
    title: 'Sample Multiple Choice Question',
    xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0.xsd"
                     identifier="sample_choice_item_001" 
                     title="Sample Multiple Choice Question" 
                     adaptive="false" 
                     time-dependent="false">

  <!-- Response declaration with correct answer -->
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choice_A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <!-- Outcome declarations for scoring -->
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <!-- Item body with question and choices -->
  <qti-item-body>
    <div class="question-prompt">
      <p><strong>What is the capital of Texas?</strong></p>
    </div>
    
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1" shuffle="false">
      <qti-simple-choice identifier="choice_A">Austin</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">Houston</qti-simple-choice>
      <qti-simple-choice identifier="choice_C">Dallas</qti-simple-choice>
      <qti-simple-choice identifier="choice_D">San Antonio</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <!-- Response processing using MATCH_CORRECT template -->
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />

</qti-assessment-item>`,
    interactionType: 'choice'
  },
  {
    identifier: 'sample_text_item_002', 
    title: 'Sample Text Entry Question',
    xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0.xsd"
                     identifier="sample_text_item_002"
                     title="Sample Text Entry Question"
                     adaptive="false"
                     time-dependent="false">

  <!-- Response declaration with correct text answer -->
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>Austin</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <!-- Outcome declarations for scoring -->
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <!-- Item body with text entry -->
  <qti-item-body>
    <div class="question-prompt">
      <p><strong>What is the capital city of Texas? (Type your answer)</strong></p>
    </div>
    
    <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="20" />
  </qti-item-body>

  <!-- Response processing using MATCH_CORRECT template -->
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />

</qti-assessment-item>`,
    interactionType: 'textEntry'
  }
];

async function generateScoredItems() {
  console.log('🎯 Generating Properly Scored QTI Items\n');
  
  try {
    // Check authentication
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    const createdItems = [];
    
    // Create each sample item
    for (const [index, itemData] of SAMPLE_ITEMS.entries()) {
      console.log(`📝 Creating item ${index + 1}: ${itemData.title}`);
      console.log('─'.repeat(60));
      
      try {
        // Create the item via API
        const createResponse = await fetch('/api/ims/qti/v3p0/assessment-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            identifier: itemData.identifier,
            title: itemData.title,
            interactionType: itemData.interactionType,
            xmlContent: itemData.xmlContent,
            metadata: {
              purpose: 'scoring-test',
              created: new Date().toISOString(),
              hasCorrectResponse: true,
              hasScoring: true,
              template: 'match_correct'
            }
          })
        });
        
        if (createResponse.ok) {
          const created = await createResponse.json();
          const itemId = created.data?.id || created.id || 'unknown';
          
          console.log(`✅ Created successfully`);
          console.log(`   Item ID: ${itemId}`);
          console.log(`   Identifier: ${itemData.identifier}`);
          
          createdItems.push({
            id: itemId,
            identifier: itemData.identifier,
            title: itemData.title,
            interactionType: itemData.interactionType
          });
          
          // Verify the item was created with proper scoring
          console.log('🔍 Verifying scoring metadata...');
          
          const verifyResponse = await fetch(`/api/ims/qti/v3p0/assessment-items/${itemId}`, {
            credentials: 'include'
          });
          
          if (verifyResponse.ok) {
            const itemDetails = await verifyResponse.json();
            const item = itemDetails.data?.item || itemDetails.item || itemDetails;
            
            const hasCorrectResponse = item.responseDeclarations?.[0]?.correctResponse?.values?.length > 0;
            const hasTemplate = !!item.responseProcessingTemplate;
            const hasMaxScore = item.outcomeDeclarations?.some(o => o.identifier === 'MAXSCORE');
            
            console.log(`   ✅ Correct Response: ${hasCorrectResponse ? '✓' : '❌'}`);
            console.log(`   ✅ Processing Template: ${hasTemplate ? '✓' : '❌'}`);
            console.log(`   ✅ MAXSCORE Declaration: ${hasMaxScore ? '✓' : '❌'}`);
            
            if (hasCorrectResponse && hasTemplate && hasMaxScore) {
              console.log(`   🎉 Item is properly configured for scoring!`);
            } else {
              console.log(`   ⚠️  Item may have scoring issues`);
            }
          }
          
        } else {
          const error = await createResponse.json().catch(() => ({}));
          console.error(`❌ Failed to create item: ${createResponse.status}`);
          console.error(`   Error:`, error);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating item ${itemData.identifier}:`, error.message);
      }
    }
    
    // Test scoring on created items
    if (createdItems.length > 0) {
      console.log('\n🧪 Testing Scoring on New Items');
      console.log('='.repeat(50));
      
      for (const item of createdItems) {
        console.log(`\n🎯 Testing item: ${item.title} (${item.id})`);
        
        // Test correct answer
        const correctAnswer = item.interactionType === 'choice' ? 'choice_A' : 'Austin';
        console.log(`   Testing correct answer: "${correctAnswer}"`);
        
        try {
          const testResponse = await fetch(`/api/ims/qti/v3p0/items/${item.id}/process-response`, {
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
          
          if (testResponse.ok) {
            const result = await testResponse.json();
            const score = result.data?.score ?? result.score ?? 0;
            const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
            
            console.log(`   📊 Result: ${score}/${maxScore} ${score === maxScore && maxScore > 0 ? '✅' : '❌'}`);
            
            if (score === maxScore && maxScore > 0) {
              console.log(`   🎉 SCORING WORKS! Correct answer scored properly.`);
            } else {
              console.log(`   ⚠️  Scoring issue: Expected 1/1, got ${score}/${maxScore}`);
            }
          } else {
            console.log(`   ❌ Test failed: ${testResponse.status}`);
          }
        } catch (testError) {
          console.log(`   ❌ Test error: ${testError.message}`);
        }
        
        // Test incorrect answer
        const incorrectAnswer = item.interactionType === 'choice' ? 'choice_B' : 'Houston';
        console.log(`   Testing incorrect answer: "${incorrectAnswer}"`);
        
        try {
          const testResponse = await fetch(`/api/ims/qti/v3p0/items/${item.id}/process-response`, {
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
          
          if (testResponse.ok) {
            const result = await testResponse.json();
            const score = result.data?.score ?? result.score ?? 0;
            const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
            
            console.log(`   📊 Result: ${score}/${maxScore} ${score === 0 && maxScore > 0 ? '✅' : '❌'}`);
            
            if (score === 0 && maxScore > 0) {
              console.log(`   🎉 SCORING WORKS! Incorrect answer scored properly.`);
            } else {
              console.log(`   ⚠️  Scoring issue: Expected 0/1, got ${score}/${maxScore}`);
            }
          } else {
            console.log(`   ❌ Test failed: ${testResponse.status}`);
          }
        } catch (testError) {
          console.log(`   ❌ Test error: ${testError.message}`);
        }
      }
    }
    
    // Summary
    console.log('\n📋 Summary');
    console.log('='.repeat(30));
    console.log(`✅ Created ${createdItems.length} properly scored items`);
    console.log('\nNew Item IDs for testing:');
    createdItems.forEach(item => {
      console.log(`   ${item.id} - ${item.title}`);
    });
    
    console.log('\n💡 Next Steps:');
    console.log('1. Use these new item IDs in your tests instead of the old unscored ones');
    console.log('2. Verify that POST /ims/qti/v3p0/items/{newItemId}/process-response returns proper scores');
    console.log('3. Update any test references to use the new properly scored items');
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
  }
}

// Run the generator
if (require.main === module) {
  generateScoredItems().catch(console.error);
}

module.exports = { generateScoredItems };
