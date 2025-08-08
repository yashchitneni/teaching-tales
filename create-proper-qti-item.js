// Create a properly formatted QTI item that will pass validation
// Copy and paste this into your browser console

async function createProperQTIItem() {
  console.log('🎯 Creating Properly Formatted QTI Item\n');
  
  const properItem = {
    identifier: 'test_scored_item_' + Date.now(),
    title: 'Math Test - Addition',
    interactionType: 'choice',  // This is required and must be one of: choice, textEntry, extendedText
    xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     identifier="test_scored_item_${Date.now()}" 
                     title="Math Test - Addition" 
                     adaptive="false" 
                     time-dependent="false">
  
  <!-- Response Declaration with Correct Answer -->
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choice_A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
  <!-- Score Outcome Declaration -->
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <!-- Maximum Score Declaration -->
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <!-- Question Content -->
  <qti-item-body>
    <p><strong>What is 2 + 2?</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choice_A">4</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">5</qti-simple-choice>
      <qti-simple-choice identifier="choice_C">3</qti-simple-choice>
      <qti-simple-choice identifier="choice_D">6</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <!-- Response Processing with MATCH_CORRECT Template -->
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />
  
</qti-assessment-item>`
  };
  
  try {
    console.log('📝 Creating QTI item with proper validation...');
    console.log('Item data:', {
      identifier: properItem.identifier,
      title: properItem.title,
      interactionType: properItem.interactionType,
      xmlLength: properItem.xmlContent.length
    });
    
    const response = await fetch('/api/ims/qti/v3p0/assessment-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(properItem)
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Item created successfully!');
      console.log('Response:', result);
      
      // Extract the item ID from the response
      const itemId = result.data?.id || result.id || result.data?.item?.id;
      
      if (itemId) {
        console.log(`🎯 New Item ID: ${itemId}`);
        
        // Test the new item immediately
        console.log('\\n🧪 Testing the new item...');
        await testNewItemScoring(itemId);
        
      } else {
        console.log('❌ Could not find item ID in response');
        console.log('Available keys:', Object.keys(result));
        
        // Try to find any ID-like field
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
        
        const foundIds = findIds(result);
        if (foundIds.length > 0) {
          console.log('Found potential IDs:', foundIds);
          const testId = foundIds[0].value;
          console.log(`\\n🧪 Testing with found ID: ${testId}`);
          await testNewItemScoring(testId);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ Item creation failed:', errorText);
      
      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          console.log('Error details:', errorData.error.message);
        }
      } catch (e) {
        // Error text is not JSON
        console.log('Raw error:', errorText.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating item:', error);
  }
}

async function testNewItemScoring(itemId) {
  try {
    console.log(`\\n📋 Testing item scoring: ${itemId}`);
    console.log('─'.repeat(50));
    
    // First verify the item has proper metadata
    const itemResponse = await fetch(`/api/ims/qti/v3p0/assessment-items/${itemId}`, {
      credentials: 'include'
    });
    
    if (!itemResponse.ok) {
      console.log(`❌ Failed to fetch item details: ${itemResponse.status}`);
      return;
    }
    
    const itemData = await itemResponse.json();
    const item = itemData.data?.item || itemData.item || itemData;
    
    console.log(`✅ Item retrieved: ${item.title || 'No title'}`);
    
    // Check scoring metadata
    const hasResponseDecl = item.responseDeclarations?.[0]?.correctResponse?.values?.length > 0;
    const hasTemplate = !!item.responseProcessingTemplate;
    const hasOutcomes = item.outcomeDeclarations?.length > 0;
    
    console.log(`\\n🎯 Scoring Metadata Check:`);
    console.log(`   Response Declaration: ${hasResponseDecl ? '✅' : '❌'}`);
    if (hasResponseDecl) {
      console.log(`   Correct Answer: ${JSON.stringify(item.responseDeclarations[0].correctResponse.values)}`);
    }
    console.log(`   Processing Template: ${hasTemplate ? '✅ ' + item.responseProcessingTemplate : '❌'}`);
    console.log(`   Outcome Declarations: ${hasOutcomes ? '✅ (' + item.outcomeDeclarations.length + ')' : '❌'}`);
    
    // Test correct answer (choice_A = 4)
    console.log(`\\n🧪 Testing correct answer (choice_A)...`);
    const correctResponse = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        responses: { RESPONSE: 'choice_A' },
        attemptId: 'test-correct-' + Date.now()
      })
    });
    
    if (correctResponse.ok) {
      const correctResult = await correctResponse.json();
      const score = correctResult.data?.score ?? correctResult.score ?? 0;
      const maxScore = correctResult.data?.maxScore ?? correctResult.maxScore ?? 0;
      
      console.log(`📊 Correct Answer Result: ${score}/${maxScore}`);
      
      if (score > 0 && maxScore > 0) {
        console.log(`🎉 SUCCESS: Item has working scoring for correct answers!`);
        
        // Test wrong answer (choice_B = 5)
        console.log(`\\n🧪 Testing wrong answer (choice_B)...`);
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
          
          console.log(`📊 Wrong Answer Result: ${wrongScore}/${maxScore}`);
          
          if (wrongScore === 0) {
            console.log(`✨ PERFECT! Complete scoring system is working:`);
            console.log(`   ✅ Correct answers score: ${score}/${maxScore}`);
            console.log(`   ✅ Wrong answers score: ${wrongScore}/${maxScore}`);
            console.log(`\\n🎯 CONCLUSION: QTI scoring fix is SUCCESSFUL! 🎉`);
          } else {
            console.log(`⚠️ ISSUE: Wrong answers should score 0, but got ${wrongScore}`);
          }
        }
        
      } else {
        console.log(`❌ PROBLEM: Item still returns ${score}/${maxScore} - scoring not working`);
      }
    } else {
      console.log(`❌ Failed to test correct answer: ${correctResponse.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing item ${itemId}:`, error);
  }
}

// Run the creation
createProperQTIItem();
