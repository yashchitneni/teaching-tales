#!/usr/bin/env node

// Interactive Test Runner for OneRoster Child User Creation API
// This script helps you test the API with real authentication

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class OneRosterAPITester {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.cookies = '';
    this.userId = '';
  }

  // Helper to prompt user input
  async prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  // Step 1: Login and get authentication cookies
  async login() {
    console.log('\n🔐 AUTHENTICATION STEP');
    console.log('===================');
    
    const email = await this.prompt('Enter your email: ');
    const password = await this.prompt('Enter your password: ');

    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true,
        validateStatus: () => true // Don't throw on non-2xx status
      });

      if (response.status === 200 && response.data.success) {
        // Extract cookies from response
        if (response.headers['set-cookie']) {
          this.cookies = response.headers['set-cookie']
            .map(cookie => cookie.split(';')[0])
            .join('; ');
        }
        
        this.userId = response.data.data.user.id;
        
        console.log('✅ Login successful!');
        console.log(`👤 User ID: ${this.userId}`);
        console.log(`🍪 Cookies set: ${this.cookies ? 'Yes' : 'No'}`);
        return true;
      } else {
        console.log('❌ Login failed:', response.data.error?.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
      return false;
    }
  }

  // Step 2: Test Child User Creation (Success Case)
  async testCreateChild() {
    console.log('\n✅ TESTING CHILD CREATION (SUCCESS CASE)');
    console.log('=====================================');

    const childData = {
      role: "student",
      givenName: "Jane",
      familyName: "Doe",
      email: "jane.doe@example.com",
      username: "jane.doe",
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

    console.log('📤 Sending child creation request...');
    console.log('Payload:', JSON.stringify(childData, null, 2));

    try {
      const response = await axios.post(`${this.baseURL}/api/ims/oneroster/v1p1/users`, childData, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies
        },
        validateStatus: () => true
      });

      console.log(`\n📥 Response Status: ${response.status}`);
      console.log('Response Body:', JSON.stringify(response.data, null, 2));

      if (response.status === 201 && response.data.user) {
        console.log('\n🎉 SUCCESS! Child created successfully!');
        console.log('✅ Validation checks:');
        console.log(`- sourcedId exists: ${!!response.data.user.sourcedId}`);
        console.log(`- role is 'student': ${response.data.user.role === 'student'}`);
        console.log(`- agents contain parent: ${response.data.user.agents?.length > 0}`);
        console.log(`- childId exists: ${!!response.data.user.metadata?.childId}`);
        console.log(`- parentId exists: ${!!response.data.user.metadata?.parentId}`);
        console.log(`- relationship established: ${response.data.user.metadata?.relationshipEstablished}`);
        return response.data.user.sourcedId;
      } else {
        console.log('❌ Child creation failed');
        return null;
      }
    } catch (error) {
      console.log('❌ Request error:', error.message);
      return null;
    }
  }

  // Step 3: Test Validation Errors
  async testValidationErrors() {
    console.log('\n🔍 TESTING VALIDATION ERRORS');
    console.log('===========================');

    const testCases = [
      {
        name: 'Missing Grade Level',
        data: {
          role: "student",
          givenName: "John",
          familyName: "Test",
          email: "john.test@example.com",
          agents: [{ sourcedId: this.userId, agentSourcedId: this.userId }],
          metadata: { age: 8 }
          // Missing grades
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
          email: "jane.test@example.com",
          grades: ["2nd Grade"],
          agents: [{ sourcedId: this.userId, agentSourcedId: this.userId }],
          metadata: { readingLevel: "beginner" }
          // Missing age
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
          email: "bob.test@example.com",
          grades: ["1st Grade"],
          metadata: { age: 6 }
          // Missing agents
        },
        expectedStatus: 400,
        expectedError: 'parent agent relationship'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      try {
        const response = await axios.post(`${this.baseURL}/api/ims/oneroster/v1p1/users`, testCase.data, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': this.cookies
          },
          validateStatus: () => true
        });

        console.log(`📥 Status: ${response.status} (expected: ${testCase.expectedStatus})`);
        console.log(`📝 Error: ${response.data.error?.message || 'No error message'}`);
        
        const statusMatch = response.status === testCase.expectedStatus;
        const errorMatch = response.data.error?.message?.includes(testCase.expectedError);
        
        if (statusMatch && errorMatch) {
          console.log('✅ PASSED - Validation working correctly');
        } else {
          console.log('❌ FAILED - Validation not working as expected');
        }
      } catch (error) {
        console.log('❌ Request error:', error.message);
      }
    }
  }

  // Step 4: Test Getting Parent with Children
  async testGetParentWithChildren() {
    console.log('\n👨‍👩‍👧‍👦 TESTING GET PARENT WITH CHILDREN');
    console.log('=====================================');

    try {
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users`, {
        headers: {
          'Cookie': this.cookies
        },
        validateStatus: () => true
      });

      console.log(`📥 Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));

      if (response.status === 200 && response.data.users?.[0]) {
        const parentUser = response.data.users[0];
        console.log('\n✅ SUCCESS! Parent data retrieved');
        console.log('🔍 Validation checks:');
        console.log(`- User has agents: ${parentUser.agents?.length > 0}`);
        console.log(`- Agents contain children: ${parentUser.agents?.some(a => a.type === 'student')}`);
        console.log(`- Agent count: ${parentUser.agents?.length || 0}`);
      } else {
        console.log('❌ Failed to get parent data');
      }
    } catch (error) {
      console.log('❌ Request error:', error.message);
    }
  }

  // Step 5: Test Getting Children via Filtering
  async testGetChildrenFiltered() {
    console.log('\n🧒 TESTING GET CHILDREN (FILTERED)');
    console.log('================================');

    try {
      const filterQuery = `agents.agentSourcedId='${this.userId}'&role='student'`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(filterQuery)}`, {
        headers: {
          'Cookie': this.cookies
        },
        validateStatus: () => true
      });

      console.log(`📥 Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        const children = response.data.users || [];
        const hasMetadata = response.data.totalCount !== undefined && response.data.hasMore !== undefined;
        console.log('\n✅ SUCCESS! Children data retrieved');
        console.log('🔍 Validation checks:');
        console.log(`- Children count: ${children.length}`);
        console.log(`- All have student role: ${children.every(c => c.role === 'student')}`);
        console.log(`- All have parent agents: ${children.every(c => c.agents?.some(a => a.type === 'parent'))}`);
        console.log(`- Has enhanced metadata: ${hasMetadata}`);
        console.log(`- Total count: ${response.data.totalCount}`);
        console.log(`- Has more: ${response.data.hasMore}`);
      } else {
        console.log('❌ Failed to get children data');
      }
    } catch (error) {
      console.log('❌ Request error:', error.message);
    }
  }

  // Step 6: Test Advanced Features (Sorting, Pagination)
  async testAdvancedFeatures() {
    console.log('\n⚡ TESTING ADVANCED FEATURES');
    console.log('===========================');

    // Test sorting
    console.log('\n🔄 Testing Sorting...');
    try {
      const sortQuery = `agents.agentSourcedId='${this.userId}'&sort=name&order=asc`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(sortQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      console.log(`📥 Sort Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Sorting metadata:');
        console.log(`- Sort field: ${response.data.sort}`);
        console.log(`- Sort order: ${response.data.order}`);
        console.log(`- Results count: ${response.data.count}`);
      } else {
        console.log('❌ Sorting test failed');
      }
    } catch (error) {
      console.log('❌ Sorting error:', error.message);
    }

    // Test pagination
    console.log('\n📄 Testing Pagination...');
    try {
      const paginationQuery = `agents.agentSourcedId='${this.userId}'&limit=1&offset=0`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(paginationQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      console.log(`📥 Pagination Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Pagination metadata:');
        console.log(`- Limit: ${response.data.limit}`);
        console.log(`- Offset: ${response.data.offset}`);
        console.log(`- Total count: ${response.data.totalCount}`);
        console.log(`- Has more: ${response.data.hasMore}`);
        console.log(`- Current page results: ${response.data.count}`);
      } else {
        console.log('❌ Pagination test failed');
      }
    } catch (error) {
      console.log('❌ Pagination error:', error.message);
    }

    // Test combined filters
    console.log('\n🔗 Testing Combined Filters...');
    try {
      const combinedQuery = `agents.agentSourcedId='${this.userId}'&role='student'&sort=name&order=desc&limit=5`;
      const response = await axios.get(`${this.baseURL}/api/ims/oneroster/v1p1/users?filter=${encodeURIComponent(combinedQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      console.log(`📥 Combined Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Combined filters working:');
        console.log(`- Agent filter: ${response.data.filters?.agentSourcedId === this.userId}`);
        console.log(`- Role filter: ${response.data.filters?.role === 'student'}`);
        console.log(`- Sorting: ${response.data.sort} ${response.data.order}`);
        console.log(`- Limit applied: ${response.data.limit}`);
      } else {
        console.log('❌ Combined filters test failed');
      }
    } catch (error) {
      console.log('❌ Combined filters error:', error.message);
    }
  }

  // Main test runner
  async runTests() {
    console.log('🧪 OneRoster Child User Creation API Tester');
    console.log('==========================================');
    console.log(`🌐 Testing against: ${this.baseURL}`);
    
    // Step 1: Authentication
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      rl.close();
      return;
    }

    // Ask which tests to run
    console.log('\n📋 Available Tests:');
    console.log('1. Create Child User (Success Case)');
    console.log('2. Test Validation Errors');
    console.log('3. Get Parent with Children');
    console.log('4. Get Children (Filtered)');
    console.log('5. Test Advanced Features (Sorting, Pagination)');
    console.log('6. Run All Tests');
    
    const choice = await this.prompt('\nWhich test would you like to run? (1-6): ');

    switch (choice) {
      case '1':
        await this.testCreateChild();
        break;
      case '2':
        await this.testValidationErrors();
        break;
      case '3':
        await this.testGetParentWithChildren();
        break;
      case '4':
        await this.testGetChildrenFiltered();
        break;
      case '5':
        await this.testAdvancedFeatures();
        break;
      case '6':
        await this.testCreateChild();
        await this.testValidationErrors();
        await this.testGetParentWithChildren();
        await this.testGetChildrenFiltered();
        await this.testAdvancedFeatures();
        break;
      default:
        console.log('Invalid choice');
    }

    console.log('\n🎉 Testing complete!');
    rl.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const baseURL = args[0] || 'http://localhost:3001';

// Run the tester
const tester = new OneRosterAPITester(baseURL);
tester.runTests().catch(console.error);