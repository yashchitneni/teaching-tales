// Quick test to see what endpoints are available
async function testAvailableEndpoints() {
  console.log('🔍 Testing Available QTI Endpoints\n');
  
  const endpoints = [
    '/api/ims/qti/v3p0/assessment-items',
    '/api/ims/qti/v3p0/items',
    '/api/qti/v3/assessments',
    '/api/generate-story',
    '/api/test-env'
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
        body: JSON.stringify({ test: true })
      });
      console.log(`  POST: ${postResp.status} ${postResp.statusText}`);
      
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  // Test the working endpoints we know about
  console.log('✅ Testing Known Working Endpoints:');
  
  const workingEndpoints = [
    '/api/ims/qti/v3p0/assessment-items/Xu90YPKH5F3WK1jfGOElx',
    '/api/ims/qti/v3p0/items/Xu90YPKH5F3WK1jfGOElx/process-response'
  ];
  
  for (const endpoint of workingEndpoints) {
    try {
      const resp = await fetch(endpoint, { 
        credentials: 'include',
        method: endpoint.includes('process-response') ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.includes('process-response') ? JSON.stringify({
          responses: { RESPONSE: 'choice_A' },
          attemptId: 'test-' + Date.now()
        }) : undefined
      });
      console.log(`${endpoint}: ${resp.status} ${resp.statusText}`);
      
      if (resp.ok && !endpoint.includes('process-response')) {
        const data = await resp.json();
        console.log(`  Sample response keys:`, Object.keys(data));
      }
      
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }
}

// Run it
testAvailableEndpoints();
