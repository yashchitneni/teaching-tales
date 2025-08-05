// Automated Test Suite for OneRoster Child User Creation API
// Run with: node automated-test.js <email> <password> [baseURL]

const axios = require('axios');

class AutomatedAPITester {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.cookies = '';
    this.userId = '';
    this.testResults = [];
  }

  // Helper to record test results
  recordTest(name, passed, details = '') {
    this.testResults.push({ name, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}${details ? ' - ' + details : ''}`);
  }

  // Login and get authentication
  async authenticate(email, password) {
    console.log('🔐 Authenticating...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true,
        validateStatus: () => true
      });

      if (response.status === 200 && response.data.success) {
        if (response.headers['set-cookie']) {
          this.cookies = response.headers['set-cookie']
            .map(cookie => cookie.split(';')[0])
            .join('; ');
        }
        
        this.userId = response.data.data.user.id;
        this.recordTest('Authentication', true, `User ID: ${this.userId}`);
        return true;
      } else {
        this.recordTest('Authentication', false, response.data.error?.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      this.recordTest('Authentication', false, error.message);
      return false;
    }
  }

  // Test child creation success case
  async testChildCreationSuccess() {
    console.log('\n📝 Testing Child Creation (Success Case)...');
    
    const childData = {
      role: "student",
      givenName: "TestChild",
      familyName: "AutoTest",
      email: `test.child.${Date.now()}@example.com`,
      username: `testchild${Date.now()}`,
      grades: ["3rd Grade"],
      agents: [{
        sourcedId: this.userId,
        agentSourcedId: this.userId
      }],
      metadata: {
        age: 8,
        readingLevel: "intermediate",
        interests: ["science", "reading"],
        preferences: {}
      }
    };

    try {
      const response = await axios.post(`${this.baseURL}/api/ims/oneroster/v1p1/users`, childData, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies
        },
        validateStatus: () => true
      });

      if (response.status === 201 && response.data.user) {
        const user = response.data.user;
        const validations = [
          { check: 'sourcedId exists', result: !!user.sourcedId },
          { check: 'role is student', result: user.role === 'student' },
          { check: 'agents exist', result: user.agents?.length > 0 },
          { check: 'childId exists', result: !!user.metadata?.childId },
          { check: 'parentId exists', result: !!user.metadata?.parentId },
          { check: 'relationship established', result: user.metadata?.relationshipEstablished === true }
        ];

        const allPassed = validations.every(v => v.result);
        const details = validations.map(v => `${v.check}: ${v.result ? '✓' : '✗'}`).join(', ');
        
        this.recordTest('Child Creation Success', allPassed, details);
        return user.sourcedId; // Return child ID for future tests
      } else {
        this.recordTest('Child Creation Success', false, `Status: ${response.status}, Error: ${response.data.error?.message}`);
        return null;
      }
    } catch (error) {
      this.recordTest('Child Creation Success', false, error.message);
      return null;
    }
  }

  // Test validation errors
  async testValidationErrors() {
    console.log('\n🔍 Testing Validation Errors...');
    
    const testCases = [
      {
        name: 'Missing Grade Level',
        data: {
          role: "student",
          givenName: "John", 
          familyName: "Test",
          email: `no.grade.${Date.now()}@example.com`,
          agents: [{ sourcedId: this.userId, agentSourcedId: this.userId }],
          metadata: { age: 8 }
        },
        expectedStatus: 400,
        expectedError: 'Grade level is required'
      },
      {
        name: 'Missing Age',
        data: {
          role: "student",
          givenName: "Jane",
          familyName: "Test", 
          email: `no.age.${Date.now()}@example.com`,
          grades: ["2nd Grade"],
          agents: [{ sourcedId: this.userId, agentSourcedId: this.userId }],
          metadata: { readingLevel: "beginner" }
        },
        expectedStatus: 400,
        expectedError: 'Age is required'
      },
      {
        name: 'Missing Agent Relationship',
        data: {
          role: "student",
          givenName: "Bob",
          familyName: "Test",
          email: `no.agent.${Date.now()}@example.com`,
          grades: ["1st Grade"],
          metadata: { age: 6 }
        },
        expectedStatus: 400,
        expectedError: 'parent agent relationship'
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.baseURL}/api/ims/oneroster/v1p1/users`, testCase.data, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': this.cookies
          },
          validateStatus: () => true
        });

        const statusMatch = response.status === testCase.expectedStatus;
        const errorMatch = response.data.error?.message?.toLowerCase().includes(testCase.expectedError.toLowerCase());
        const passed = statusMatch && errorMatch;
        
        this.recordTest(`Validation: ${testCase.name}`, passed, 
          `Status: ${response.status} (expected ${testCase.expectedStatus}), Error contains "${testCase.expectedError}": ${errorMatch}`);
        
      } catch (error) {
        this.recordTest(`Validation: ${testCase.name}`, false, error.message);
      }
    }
  }

  // Test getting parent with children
  async testGetParentWithChildren() {
    console.log('\n👨‍👩‍👧‍👦 Testing Get Parent with Children...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      if (response.status === 200 && response.data.users?.[0]) {
        const parentUser = response.data.users[0];
        const hasAgents = parentUser.agents?.length > 0;
        const hasChildAgents = parentUser.agents?.some(a => a.type === 'student');
        
        this.recordTest('Get Parent with Children', hasAgents, 
          `Agents: ${parentUser.agents?.length || 0}, Child agents: ${hasChildAgents}`);
      } else {
        this.recordTest('Get Parent with Children', false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Get Parent with Children', false, error.message);
    }
  }

  // Test getting children via filtering
  async testGetChildrenFiltered() {
    console.log('\n🧒 Testing Get Children (Filtered)...');
    
    try {
      const filterQuery = `agents.agentSourcedId='${this.userId}'&role='student'`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(filterQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      if (response.status === 200) {
        const children = response.data.users || [];
        const allStudents = children.every(c => c.role === 'student');
        const allHaveParentAgents = children.every(c => c.agents?.some(a => a.type === 'parent'));
        const hasMetadata = response.data.totalCount !== undefined && 
                           response.data.hasMore !== undefined;
        const passed = response.status === 200 && allStudents && hasMetadata;
        
        this.recordTest('Get Children (Filtered)', passed, 
          `Count: ${children.length}, All students: ${allStudents}, Has metadata: ${hasMetadata}`);
      } else {
        this.recordTest('Get Children (Filtered)', false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Get Children (Filtered)', false, error.message);
    }
  }

  // Test advanced filtering and sorting
  async testAdvancedFeatures() {
    console.log('\n⚡ Testing Advanced Features (Sorting, Pagination)...');
    
    // Test sorting
    try {
      const sortQuery = `agents.agentSourcedId='${this.userId}'&sort=name&order=asc`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(sortQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      if (response.status === 200) {
        const hasSortMetadata = response.data.sort === 'name' && response.data.order === 'asc';
        this.recordTest('Sorting (name asc)', hasSortMetadata, 
          `Sort: ${response.data.sort}, Order: ${response.data.order}`);
      } else {
        this.recordTest('Sorting (name asc)', false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Sorting (name asc)', false, error.message);
    }

    // Test pagination
    try {
      const paginationQuery = `agents.agentSourcedId='${this.userId}'&limit=1&offset=0`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(paginationQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      if (response.status === 200) {
        const hasPaginationMetadata = response.data.limit === 1 && 
                                     response.data.offset === 0 &&
                                     typeof response.data.hasMore === 'boolean';
        this.recordTest('Pagination', hasPaginationMetadata, 
          `Limit: ${response.data.limit}, Offset: ${response.data.offset}, HasMore: ${response.data.hasMore}`);
      } else {
        this.recordTest('Pagination', false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Pagination', false, error.message);
    }
  }

  // Print final results
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`📊 Tests Passed: ${passed}/${total} (${passRate}%)`);
    console.log('');
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Your Child User Creation API is working perfectly!');
    } else {
      console.log('❌ Some tests failed. Check the details above.');
      console.log('\n💡 Common issues:');
      console.log('- Make sure your server is running on the correct port');
      console.log('- Verify your credentials are correct');
      console.log('- Check server logs for detailed error information');
    }
    
    return passed === total;
  }

  // Run all tests
  async runAllTests(email, password) {
    console.log(`🧪 Running Automated API Tests against ${this.baseURL}`);
    console.log('='.repeat(60));
    
    // Authenticate first
    const authSuccess = await this.authenticate(email, password);
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Cannot proceed with tests.');
      return false;
    }

    // Run all test suites
    await this.testChildCreationSuccess();
    await this.testValidationErrors();
    await this.testGetParentWithChildren();
    await this.testGetChildrenFiltered();
    await this.testAdvancedFeatures();
    
    // Print summary
    return this.printSummary();
  }
}

// Command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node automated-test.js <email> <password> [baseURL]');
    console.log('Example: node automated-test.js user@example.com mypassword http://localhost:3001');
    process.exit(1);
  }

  const [email, password, baseURL] = args;
  const tester = new AutomatedAPITester(baseURL);
  
  tester.runAllTests(email, password)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = AutomatedAPITester;