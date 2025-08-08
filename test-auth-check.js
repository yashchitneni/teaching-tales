// Quick auth check - copy and paste into browser console
async function checkAuth() {
  console.log('🔐 Checking authentication...');
  
  try {
    // Test the auth endpoint first
    const authResp = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    console.log(`Auth check: ${authResp.status} ${authResp.statusText}`);
    
    if (authResp.ok) {
      const authData = await authResp.json();
      console.log('✅ Authenticated user:', authData);
      
      // Now test our enhanced endpoint
      console.log('\n🧪 Testing enhanced endpoint with auth...');
      
      const testItem = {
        identifier: 'auth_test_' + Date.now(),
        title: 'Auth Test Question',
        interactionType: 'choice',
        xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     identifier="auth_test_${Date.now()}" 
                     title="Auth Test Question">
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
    <p><strong>Test question?</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choice_A">Answer A</qti-simple-choice>
      <qti-simple-choice identifier="choice_B">Answer B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />
</qti-assessment-item>`
      };
      
      const enhancedResp = await fetch('/api/ims/qti/v3p0/assessment-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      console.log(`Enhanced endpoint: ${enhancedResp.status} ${enhancedResp.statusText}`);
      
      if (enhancedResp.status === 401) {
        console.log('❌ Still 401 - auth token issue');
        console.log('Check server logs for authentication debugging');
      } else if (enhancedResp.ok) {
        console.log('✅ Enhanced endpoint is working!');
      } else {
        const errorText = await enhancedResp.text();
        console.log('❌ Enhanced endpoint error:', errorText);
      }
      
    } else {
      console.log('❌ Not authenticated - please log in first');
      console.log('Go to http://localhost:3001 and log in, then try again');
    }
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

checkAuth();
