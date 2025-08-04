// Test script for OneRoster Agent Relationships
// This validates that our bidirectional relationship logic works correctly

const testCases = [
  {
    name: "Create Child User with Agent Relationship (Enhanced)",
    method: "POST",
    url: "/api/ims/oneroster/v1p1/users",
    payload: {
      role: "student",
      givenName: "Jane",
      familyName: "Doe",
      email: "jane.doe@example.com",
      username: "jane.doe",
      grades: ["3rd Grade"],
      agents: [{
        sourcedId: "PARENT_ID_HERE", // Replace with actual parent ID
        agentSourcedId: "PARENT_ID_HERE"
      }],
      metadata: {
        age: 8,
        readingLevel: "intermediate",
        interests: ["science", "reading"],
        preferences: {}
      }
    },
    expectedResponse: {
      status: 201,
      checks: [
        "response.user.sourcedId should exist",
        "response.user.role should be 'student'",
        "response.user.agents should contain bidirectional relationships",
        "response.user.metadata.childId should exist",
        "response.user.metadata.parentId should exist",
        "response.user.metadata.relationshipEstablished should be true"
      ]
    }
  },
  {
    name: "Get Parent User with Child Agents",
    method: "GET", 
    url: "/api/ims/oneroster/v1p1/users",
    expectedResponse: {
      status: 200,
      checks: [
        "response.users[0].agents should contain children",
        "response.users[0].role should be 'parent'",
        "Each agent should have sourcedId, agentSourcedId, and type"
      ]
    }
  },
  {
    name: "Get Children of Parent (Filtered)",
    method: "GET",
    url: "/api/ims/oneroster/v1p1/users?filter=agents.agentSourcedId='PARENT_ID_HERE'",
    expectedResponse: {
      status: 200,
      checks: [
        "response.users should be array of children",
        "Each child should have role 'student'",
        "Each child should have parent in agents array"
      ]
    }
  }
];

console.log("OneRoster Agent Relationship Test Cases");
console.log("=====================================");
console.log("");

// Enhanced validation test cases
const validationTestCases = [
  {
    name: "Validation: Missing Grade Level",
    method: "POST", 
    url: "/api/ims/oneroster/v1p1/users",
    payload: {
      role: "student",
      givenName: "John",
      familyName: "Test",
      email: "john.test@example.com",
      agents: [{ sourcedId: "PARENT_ID_HERE", agentSourcedId: "PARENT_ID_HERE" }],
      metadata: { age: 8 }
      // Missing grades field
    },
    expectedResponse: {
      status: 400,
      checks: ["Should return error about missing grade level"]
    }
  },
  {
    name: "Validation: Missing Age",
    method: "POST",
    url: "/api/ims/oneroster/v1p1/users", 
    payload: {
      role: "student",
      givenName: "Jane",
      familyName: "Test",
      email: "jane.test@example.com",
      grades: ["2nd Grade"],
      agents: [{ sourcedId: "PARENT_ID_HERE", agentSourcedId: "PARENT_ID_HERE" }],
      metadata: { readingLevel: "beginner" }
      // Missing age field
    },
    expectedResponse: {
      status: 400,
      checks: ["Should return error about missing age"]
    }
  },
  {
    name: "Validation: Missing Agent Relationship",
    method: "POST",
    url: "/api/ims/oneroster/v1p1/users",
    payload: {
      role: "student", 
      givenName: "Bob",
      familyName: "Test",
      email: "bob.test@example.com",
      grades: ["1st Grade"],
      metadata: { age: 6 }
      // Missing agents field
    },
    expectedResponse: {
      status: 400,
      checks: ["Should return error about missing parent agent relationship"]
    }
  }
];

console.log("✅ MAIN TEST CASES:");
console.log("=================");
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Method: ${testCase.method}`);
  console.log(`   URL: ${testCase.url}`);
  
  if (testCase.payload) {
    console.log(`   Payload:`);
    console.log(`   ${JSON.stringify(testCase.payload, null, 4)}`);
  }
  
  console.log(`   Expected Status: ${testCase.expectedResponse.status}`);
  console.log(`   Validation Checks:`);
  testCase.expectedResponse.checks.forEach(check => {
    console.log(`   - ${check}`);
  });
  console.log("");
});

console.log("");
console.log("🔍 VALIDATION TEST CASES:");
console.log("========================");
validationTestCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Method: ${testCase.method}`);
  console.log(`   URL: ${testCase.url}`);
  
  if (testCase.payload) {
    console.log(`   Payload:`);
    console.log(`   ${JSON.stringify(testCase.payload, null, 4)}`);
  }
  
  console.log(`   Expected Status: ${testCase.expectedResponse.status}`);
  console.log(`   Validation Checks:`);
  testCase.expectedResponse.checks.forEach(check => {
    console.log(`   - ${check}`);
  });
  console.log("");
});

console.log("Manual Testing Instructions:");
console.log("==========================");
console.log("");
console.log("1. Replace 'PARENT_ID_HERE' with actual logged-in parent user ID");
console.log("2. Use these test cases in Postman or curl");
console.log("3. Ensure authentication headers are included");
console.log("4. Validate each response matches the expected checks");
console.log("");
console.log("Example curl commands:");
console.log("");
console.log("# Create child user");
console.log("curl -X POST http://localhost:3000/api/ims/oneroster/v1p1/users \\");
console.log("  -H 'Content-Type: application/json' \\");
console.log("  -H 'Cookie: access-token=YOUR_TOKEN' \\");
console.log("  -d '{ /* payload from test case 1 */ }'");
console.log("");
console.log("# Get parent with children agents");
console.log("curl -X GET http://localhost:3000/api/ims/oneroster/v1p1/users \\");
console.log("  -H 'Cookie: access-token=YOUR_TOKEN'");
console.log("");
console.log("# Get children of parent");
console.log("curl -X GET 'http://localhost:3000/api/ims/oneroster/v1p1/users?filter=agents.agentSourcedId=PARENT_ID' \\");
console.log("  -H 'Cookie: access-token=YOUR_TOKEN'");
console.log("");

// Validation function for manual testing
function validateAgentRelationship(parentUser, childUser) {
  const issues = [];
  
  // Check parent has child in agents
  const parentHasChild = parentUser.agents?.some(
    agent => agent.sourcedId === childUser.sourcedId && agent.type === 'student'
  );
  if (!parentHasChild) {
    issues.push("Parent missing child in agents array");
  }
  
  // Check child has parent in agents  
  const childHasParent = childUser.agents?.some(
    agent => agent.sourcedId === parentUser.sourcedId && agent.type === 'parent'
  );
  if (!childHasParent) {
    issues.push("Child missing parent in agents array");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

console.log("// Validation function for testing responses:");
console.log(validateAgentRelationship.toString());