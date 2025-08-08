#!/usr/bin/env node

/**
 * Debug script to examine QTI items and test scoring
 * This will help us verify the current state and test fixes
 */

const { execSync } = require('child_process');

// The two problematic item IDs from your testing
const ITEM_IDS = [
  'Xu90YPKH5F3WK1jfGOElx',
  'Xx1PDRdk2z8Sb_IkniWcu'
];

const BASE_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:3001';

async function debugQTIItems() {
  console.log('🔍 Debugging QTI Items - Current State\n');
  
  try {
    // Get auth token (you'll need to be logged in)
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    // Check each item
    for (const itemId of ITEM_IDS) {
      console.log(`📋 Examining item: ${itemId}`);
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
        console.log('Item structure:', JSON.stringify(itemData, null, 2));
        
        // Check for scoring metadata
        const item = itemData.data?.item || itemData.item || itemData;
        
        console.log('\n🎯 Scoring Analysis:');
        console.log(`- Response Declarations: ${item.responseDeclarations?.length || 0}`);
        
        if (item.responseDeclarations?.[0]) {
          const respDecl = item.responseDeclarations[0];
          console.log(`  - Identifier: ${respDecl.identifier}`);
          console.log(`  - Base Type: ${respDecl.baseType}`);
          console.log(`  - Cardinality: ${respDecl.cardinality}`);
          console.log(`  - Correct Response: ${respDecl.correctResponse ? JSON.stringify(respDecl.correctResponse) : 'MISSING ❌'}`);
        }
        
        console.log(`- Response Processing Template: ${item.responseProcessingTemplate || 'MISSING ❌'}`);
        console.log(`- Has Response Rules: ${item.hasResponseRules || false}`);
        
        console.log(`- Outcome Declarations: ${item.outcomeDeclarations?.length || 0}`);
        if (item.outcomeDeclarations) {
          item.outcomeDeclarations.forEach(outcome => {
            console.log(`  - ${outcome.identifier}: ${outcome.defaultValue || 0} (max: ${outcome.normalMaximum || 'not set'})`);
          });
        }
        
        // Try to fetch and examine XML
        console.log('\n📄 XML Analysis:');
        if (item.xmlUrl) {
          console.log(`- XML URL: ${item.xmlUrl}`);
          
          try {
            // Use our new sanitized fetch
            const xmlResponse = await fetch('/api/test-xml-fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ xmlUrl: item.xmlUrl })
            });
            
            if (xmlResponse.ok) {
              const xmlContent = await xmlResponse.text();
              console.log(`- XML Length: ${xmlContent.length} characters`);
              console.log(`- Contains correct-response: ${xmlContent.includes('correct-response') || xmlContent.includes('qti-correct-response')}`);
              console.log(`- Contains MATCH_CORRECT: ${xmlContent.includes('match_correct')}`);
              console.log(`- Contains MAXSCORE: ${xmlContent.includes('MAXSCORE')}`);
            } else {
              console.log(`- XML fetch failed: ${xmlResponse.status}`);
            }
          } catch (xmlError) {
            console.log(`- XML fetch error: ${xmlError.message}`);
          }
        } else {
          console.log('- No XML URL provided ❌');
        }
        
        // Test scoring with a sample response
        console.log('\n🧪 Testing Scoring:');
        try {
          const testResponse = await fetch(`/api/ims/qti/v3p0/items/${itemId}/process-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              responses: {
                RESPONSE: 'choice_A' // Try first choice
              },
              attemptId: `test-${Date.now()}`
            })
          });
          
          if (testResponse.ok) {
            const result = await testResponse.json();
            console.log(`- Test response result:`, JSON.stringify(result, null, 2));
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
    console.log('\n💡 Recommendations:');
    console.log('Based on the analysis above, items need:');
    console.log('1. ✅ correctResponse values in responseDeclarations[0]');
    console.log('2. ✅ responseProcessingTemplate = "match_correct" or full URL');
    console.log('3. ✅ MAXSCORE outcome declaration with value 1');
    console.log('4. ✅ Valid XML with proper QTI v3 structure');
    console.log('\nNext: Run generate-scored-items.js to create properly scored replacements');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Helper endpoint to test XML fetching
async function createTestXmlEndpoint() {
  console.log('Creating temporary test endpoint for XML fetching...');
  
  const endpointCode = `
import { NextRequest, NextResponse } from 'next/server';
import { fetchItemXML } from '@/lib/api/qti-client';

export async function POST(request: NextRequest) {
  try {
    const { xmlUrl } = await request.json();
    const xmlContent = await fetchItemXML(xmlUrl);
    return new NextResponse(xmlContent, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;

  // Write the temporary endpoint
  require('fs').writeFileSync(
    './src/app/api/test-xml-fetch/route.ts',
    endpointCode
  );
}

// Run the debug
if (require.main === module) {
  createTestXmlEndpoint();
  debugQTIItems().catch(console.error);
}

module.exports = { debugQTIItems };
