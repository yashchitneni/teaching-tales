// Simple Enhanced QTI Test - Copy and paste into browser console
console.log('🚀 Testing Enhanced QTI Item Creation');

async function testEnhancedQTI() {
  const testItem = {
    identifier: 'enhanced_test_' + Date.now(),
    title: 'Enhanced Math Question',
    interactionType: 'choice',
    xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     identifier="enhanced_test_${Date.now()}" 
                     title="Enhanced Math Question" 
                     adaptive="false" 
                     time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choice_A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
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
  
  <qti-item-body>
    <p><strong>What is 3 + 3?</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choice_A">6</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">5</qti-simple-choice>
      <qti-simple-choice identifier="choice_C">7</qti-simple-choice>
      <qti-simple-choice identifier="choice_D">8</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />
  
</qti-assessment-item>`
  };

  console.log('📝 Creating enhanced item...');
  
  try {
    const response = await fetch('/api/ims/qti/v3p0/assessment-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(testItem)
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Enhanced item created!', result);
      
      // Find the item ID
      const itemId = result.data?.id || result.id || result.data?.item?.id || result.item?.id;
      
      if (itemId) {
        console.log(`🎯 Testing enhanced item: ${itemId}`);
        
        // Test it immediately
        const testResp = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            responses: { RESPONSE: 'choice_A' },
            attemptId: 'enhanced-test-' + Date.now()
          })
        });
        
        if (testResp.ok) {
          const testResult = await testResp.json();
          const score = testResult.data?.score ?? testResult.score ?? 0;
          const maxScore = testResult.data?.maxScore ?? testResult.maxScore ?? 0;
          
          console.log(`🧪 Enhanced Test Result: ${score}/${maxScore}`);
          
          if (score > 0 && maxScore > 0) {
            console.log('🎉 SUCCESS! Enhanced processing is working!');
            console.log('✅ Scoring is now functional');
          } else {
            console.log('❌ Still getting 0/0 - need more debugging');
          }
        } else {
          console.log(`❌ Test failed: ${testResp.status}`);
        }
      } else {
        console.log('❌ No item ID found in response');
        console.log('Available keys:', Object.keys(result));
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Creation failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Run the test
testEnhancedQTI();
