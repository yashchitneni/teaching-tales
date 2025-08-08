// Browser version - copy and paste this into console
async function testAvailableEndpoints() {
  console.log('🔍 Testing Available QTI Endpoints\n');
  
  const endpoints = [
    '/api/ims/qti/v3p0/assessment-items',
    '/api/ims/qti/v3p0/items', 
    '/api/qti/v3/assessments',
    '/api/generate-story'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      // Test GET first
      const getResp = await fetch(endpoint, { 
        credentials: 'include',
        method: 'GET'
      });
      console.log(`  GET: ${getResp.status} ${getResp.statusText}`);
      
      // Test POST
      const postResp = await fetch(endpoint, { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: 'test_item_001',
          title: 'Test Item',
          xmlContent: '<qti-assessment-item></qti-assessment-item>'
        })
      });
      console.log(`  POST: ${postResp.status} ${postResp.statusText}`);
      
      if (postResp.ok) {
        const data = await postResp.json();
        console.log(`  POST Response:`, data);
      } else if (postResp.status !== 404) {
        const errorText = await postResp.text();
        console.log(`  POST Error:`, errorText.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
    console.log('');
  }
}

testAvailableEndpoints();
