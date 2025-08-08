// Browser Debug Script for QTI Items
// Copy and paste this into your browser's developer console while logged in

async function debugQTIItemsInBrowser() {
  console.log('🔍 Debugging QTI Items - Browser Version\n');
  
  const ITEM_IDS = [
    'Xu90YPKH5F3WK1jfGOElx',
    'Xx1PDRdk2z8Sb_IkniWcu'
  ];
  
  try {
    // Check authentication
    console.log('✅ Using browser session authentication');
    
    // Check each item
    for (const itemId of ITEM_IDS) {
      console.log(`\n📋 Examining item: ${itemId}`);
      console.log('─'.repeat(50));
      
      try {
        // Get item details
        const itemResponse = await fetch(`/api/ims/qti/v3p0/assessment-items/${itemId}`, {
          credentials: 'include'
        });
        
        if (!itemResponse.ok) {
          console.error(`❌ Failed to fetch item ${itemId}: ${itemResponse.status}`);
          continue;
        }
        
        const itemData = await itemResponse.json();
        const item = itemData.data?.item || itemData.item || itemData;
        
        console.log(`✅ Item fetched successfully`);
        console.log(`   Title: ${item.title || 'not set'}`);
        
        // Check for scoring metadata
        console.log('\n🎯 Scoring Analysis:');
        
        if (item.responseDeclarations?.[0]) {
          const respDecl = item.responseDeclarations[0];
          const hasCorrectResponse = respDecl.correctResponse?.values?.length > 0;
          console.log(`✅ Response Declaration Found:`);
          console.log(`   - Identifier: ${respDecl.identifier}`);
          console.log(`   - Base Type: ${respDecl.baseType}`);
          console.log(`   - Correct Response: ${hasCorrectResponse ? '✅ ' + JSON.stringify(respDecl.correctResponse.values) : '❌ MISSING'}`);
        } else {
          console.log(`❌ No response declarations found`);
        }
        
        const hasTemplate = !!item.responseProcessingTemplate;
        console.log(`Response Processing: ${hasTemplate ? '✅ ' + item.responseProcessingTemplate : '❌ MISSING'}`);
        
        if (item.outcomeDeclarations?.length > 0) {
          console.log(`✅ Outcome Declarations (${item.outcomeDeclarations.length}):`);
          item.outcomeDeclarations.forEach(outcome => {
            console.log(`   - ${outcome.identifier}: default=${outcome.defaultValue}, max=${outcome.normalMaximum || 'not set'}`);
          });
        } else {
          console.log(`❌ No outcome declarations found`);
        }
        
        // Test scoring
        console.log('\n🧪 Testing Scoring:');
        const testResponse = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            responses: { RESPONSE: 'choice_A' },
            attemptId: `browser-test-${Date.now()}`
          })
        });
        
        if (testResponse.ok) {
          const result = await testResponse.json();
          const score = result.data?.score ?? result.score ?? 0;
          const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
          
          console.log(`📊 Test Result: ${score}/${maxScore}`);
          
          if (score === 0 && maxScore === 0) {
            console.log(`🔍 CONFIRMED: Item returns 0/0 - missing scoring metadata`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error with item ${itemId}:`, error);
      }
    }
    
    console.log('\n💡 Next Step: Create properly scored items');
    console.log('Run this in console to create test items with scoring:');
    console.log(`
// Create properly scored test items
async function createScoredTestItems() {
  const items = [
    {
      identifier: 'test_choice_001',
      title: 'Test Choice Question',
      interactionType: 'choice',
      xmlContent: \`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test_choice_001" title="Test Choice Question" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>choice_A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p><strong>What is 2 + 2?</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choice_A">4</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">3</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />
</qti-assessment-item>\`
    }
  ];
  
  for (const item of items) {
    const response = await fetch('/api/ims/qti/v3p0/assessment-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(item)
    });
    
    if (response.ok) {
      const created = await response.json();
      const newId = created.data?.id || created.id;
      console.log(\`✅ Created item: \${newId}\`);
      
      // Test the new item
      const testResp = await fetch(\`/api/ims/qti/v3p0/items/\${newId}/process-response\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          responses: { RESPONSE: 'choice_A' },
          attemptId: 'test-' + Date.now()
        })
      });
      
      if (testResp.ok) {
        const result = await testResp.json();
        console.log(\`🧪 Test result: \${result.data?.score || result.score}/\${result.data?.maxScore || result.maxScore}\`);
      }
    }
  }
}

// Run it:
createScoredTestItems();
    `);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Auto-run
debugQTIItemsInBrowser();
