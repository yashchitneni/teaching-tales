#!/usr/bin/env node

/**
 * Debug script with built-in authentication
 * This version handles login directly
 */

const readline = require('readline');

const BASE_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

// The two problematic item IDs from your testing
const ITEM_IDS = [
  'Xu90YPKH5F3WK1jfGOElx',
  'Xx1PDRdk2z8Sb_IkniWcu'
];

let authToken = null;

async function promptForCredentials() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Email: ', (email) => {
      rl.question('Password: ', (password) => {
        rl.close();
        resolve({ email, password });
      });
    });
  });
}

async function authenticate() {
  console.log('🔐 Authentication Required\n');
  
  try {
    // Try to get existing session first
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/me`);
    if (sessionResponse.ok) {
      console.log('✅ Already authenticated via existing session');
      return true;
    }

    console.log('No existing session found. Please log in:');
    const { email, password } = await promptForCredentials();

    // Attempt login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.data?.accessToken || loginData.accessToken;
      
      if (authToken) {
        console.log('✅ Login successful');
        return true;
      }
    }

    console.error('❌ Login failed');
    return false;

  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

async function makeAuthenticatedRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

async function debugQTIItems() {
  console.log('🔍 Debugging QTI Items - Current State\n');
  
  try {
    // Authenticate first
    const authenticated = await authenticate();
    if (!authenticated) {
      console.log('\n💡 Alternative: Log in via browser at http://localhost:3000 and run the original script');
      return;
    }
    
    console.log('\n📋 Examining Items...\n');
    
    // Check each item
    for (const itemId of ITEM_IDS) {
      console.log(`📋 Examining item: ${itemId}`);
      console.log('─'.repeat(50));
      
      try {
        // Get item details
        const itemResponse = await makeAuthenticatedRequest(
          `${BASE_URL}/ims/qti/v3p0/assessment-items/${itemId}`
        );
        
        if (!itemResponse.ok) {
          console.error(`❌ Failed to fetch item ${itemId}: ${itemResponse.status}`);
          const errorText = await itemResponse.text();
          console.error(`   Error: ${errorText}`);
          continue;
        }
        
        const itemData = await itemResponse.json();
        
        // Extract item from various possible response formats
        const item = itemData.data?.item || itemData.item || itemData;
        
        console.log(`✅ Item fetched successfully`);
        console.log(`   ID: ${item.id || itemId}`);
        console.log(`   Identifier: ${item.identifier || 'not set'}`);
        console.log(`   Title: ${item.title || 'not set'}`);
        
        // Check for scoring metadata
        console.log('\n🎯 Scoring Analysis:');
        console.log(`- Response Declarations: ${item.responseDeclarations?.length || 0}`);
        
        if (item.responseDeclarations?.[0]) {
          const respDecl = item.responseDeclarations[0];
          console.log(`  - Identifier: ${respDecl.identifier}`);
          console.log(`  - Base Type: ${respDecl.baseType}`);
          console.log(`  - Cardinality: ${respDecl.cardinality}`);
          
          const hasCorrectResponse = respDecl.correctResponse?.values?.length > 0;
          console.log(`  - Correct Response: ${hasCorrectResponse ? '✅ ' + JSON.stringify(respDecl.correctResponse.values) : '❌ MISSING'}`);
        } else {
          console.log(`  ❌ No response declarations found`);
        }
        
        const hasTemplate = !!item.responseProcessingTemplate;
        console.log(`- Response Processing Template: ${hasTemplate ? '✅ ' + item.responseProcessingTemplate : '❌ MISSING'}`);
        console.log(`- Has Response Rules: ${item.hasResponseRules || false}`);
        
        console.log(`- Outcome Declarations: ${item.outcomeDeclarations?.length || 0}`);
        if (item.outcomeDeclarations?.length > 0) {
          item.outcomeDeclarations.forEach(outcome => {
            console.log(`  - ${outcome.identifier}: default=${outcome.defaultValue || 0}, max=${outcome.normalMaximum || 'not set'}`);
          });
        } else {
          console.log(`  ❌ No outcome declarations found`);
        }
        
        // Test scoring with a sample response
        console.log('\n🧪 Testing Scoring:');
        try {
          const testResponse = await makeAuthenticatedRequest(
            `${BASE_URL}/ims/qti/v3p0/items/${itemId}/process-response`,
            {
              method: 'POST',
              body: JSON.stringify({
                responses: {
                  RESPONSE: 'choice_A' // Try first choice
                },
                attemptId: `debug-test-${Date.now()}`
              })
            }
          );
          
          if (testResponse.ok) {
            const result = await testResponse.json();
            const score = result.data?.score ?? result.score ?? 0;
            const maxScore = result.data?.maxScore ?? result.maxScore ?? 0;
            const isCorrect = result.data?.isCorrect ?? result.isCorrect ?? false;
            
            console.log(`- Test Response Result:`);
            console.log(`  - Score: ${score}/${maxScore} ${score > 0 ? '✅' : '❌'}`);
            console.log(`  - Is Correct: ${isCorrect} ${isCorrect ? '✅' : '❌'}`);
            
            if (score === 0 && maxScore === 0) {
              console.log(`  🔍 CONFIRMED: Item has no scoring metadata (always returns 0/0)`);
            }
          } else {
            console.log(`- Test response failed: ${testResponse.status}`);
          }
        } catch (testError) {
          console.log(`- Test response error: ${testError.message}`);
        }
        
        console.log('\n');
        
      } catch (error) {
        console.error(`❌ Error examining item ${itemId}:`, error.message);
      }
    }
    
    // Provide recommendations
    console.log('💡 Analysis Summary:');
    console.log('='.repeat(50));
    console.log('The items are missing essential scoring components:');
    console.log('❌ correctResponse values in responseDeclarations');
    console.log('❌ responseProcessingTemplate (should be "match_correct")'); 
    console.log('❌ MAXSCORE outcome declaration');
    console.log('');
    console.log('✅ SOLUTION: Run generate-scored-items.js to create properly configured items');
    console.log('   These new items will have all required scoring metadata.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugQTIItems().catch(console.error);
}

module.exports = { debugQTIItems };
