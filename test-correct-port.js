// Test script for correct port - Use this on localhost:3001
console.log('🚀 Testing on Correct Port (3001)');

async function testCorrectPort() {
  console.log('🔍 Current location:', window.location.href);
  
  if (!window.location.href.includes(':3001')) {
    console.log('❌ You are NOT on the correct port!');
    console.log('🔧 Please go to: http://localhost:3001');
    console.log('Then run this script again.');
    return;
  }
  
  console.log('✅ You are on the correct port (3001)');
  
  // Test authentication
  try {
    const authResp = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    console.log(`Auth check: ${authResp.status} ${authResp.statusText}`);
    
    if (authResp.ok) {
      console.log('✅ Authentication working on correct port!');
      
      // Test enhanced endpoint
      console.log('\n🧪 Testing enhanced QTI endpoint...');
      
      const testItem = {
        identifier: 'port_test_' + Date.now(),
        title: 'Port Test Question',
        interactionType: 'choice',
        xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     identifier="port_test_${Date.now()}" 
                     title="Port Test Question">
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
    <p><strong>Port test question?</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choice_A">Correct Answer</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">Wrong Answer</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />
</qti-assessment-item>`
      };
      
      const createResp = await fetch('/api/ims/qti/v3p0/assessment-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testItem)
      });
      
      console.log(`Create item: ${createResp.status} ${createResp.statusText}`);
      
      if (createResp.ok) {
        const result = await createResp.json();
        console.log('🎉 SUCCESS! Enhanced processing is working on correct port!');
        
        const itemId = result.data?.id || result.id || result.data?.item?.id || result.item?.id;
        if (itemId) {
          console.log(`Testing scoring for item: ${itemId}`);
          
          const testResp = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              responses: { RESPONSE: 'choice_A' },
              attemptId: 'port-test-' + Date.now()
            })
          });
          
          if (testResp.ok) {
            const testResult = await testResp.json();
            const score = testResult.data?.score ?? testResult.score ?? 0;
            const maxScore = testResult.data?.maxScore ?? testResult.maxScore ?? 0;
            
            console.log(`🧪 FINAL RESULT: ${score}/${maxScore}`);
            
            if (score > 0 && maxScore > 0) {
              console.log('🎉🎉🎉 COMPLETE SUCCESS! QTI Scoring is now working!');
            } else {
              console.log('❌ Still 0/0 - but at least we are on the right port now');
            }
          }
        }
      } else {
        const errorText = await createResp.text();
        console.log('❌ Create failed:', errorText);
      }
      
    } else {
      console.log('❌ Still need to log in on port 3001');
    }
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

testCorrectPort();
