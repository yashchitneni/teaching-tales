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
      username: "jane.doe",
      givenName: "Jane",
      familyName: "Doe",
      role: "student",
      orgs: [{"sourcedId": "dZNtFzQq94Bn", "type": "org"}], // Teaching Tales School
      enabledUser: true,
      email: "jane.doe@example.com",
      grades: ["3rd Grade"],
      metadata: {
        age: 8,
        readingLevel: "intermediate",
        interests: ["science", "reading"],
        parentId: this.userId
      }
    };

    console.log('📤 Sending child creation request...');
    console.log('Payload:', JSON.stringify(childData, null, 2));

    try {
      const response = await axios.post(`${this.baseURL}/ims/oneroster/rostering/v1p2/users`, childData, {
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
        console.log(`- username matches: ${response.data.user.username === childData.username}`);
        console.log(`- givenName matches: ${response.data.user.givenName === childData.givenName}`);
        console.log(`- familyName matches: ${response.data.user.familyName === childData.familyName}`);
        console.log(`- role is 'student': ${response.data.user.role === 'student'}`);
        console.log(`- orgs exist: ${response.data.user.orgs?.length > 0}`);
        console.log(`- grades exist: ${response.data.user.grades?.length > 0}`);
        console.log(`- parentId exists: ${!!response.data.user.metadata?.parentId}`);
        return response.data.user.sourcedId || response.data.user.username;
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
          username: "john.test",
          givenName: "John",
          familyName: "Test",
          role: "student",
          orgs: [{"sourcedId": "dZNtFzQq94Bn", "type": "org"}],
          enabledUser: true,
          email: "john.test@example.com",
          metadata: { age: 8, parentId: this.userId }
          // Missing grades
        },
        expectedStatus: 201,
        expectedError: 'Grade level is required'
      },
      {
        name: 'Missing Age',
        data: {
          username: "jane.test",
          givenName: "Jane",
          familyName: "Test",
          role: "student",
          orgs: [{"sourcedId": "dZNtFzQq94Bn", "type": "org"}],
          enabledUser: true,
          email: "jane.test@example.com",
          grades: ["2nd Grade"],
          metadata: { readingLevel: "beginner", parentId: this.userId }
          // Missing age
        },
        expectedStatus: 201,
        expectedError: 'Age is required'
      },
      {
        name: 'Missing Agent Relationship',
        data: {
          username: "bob.test",
          givenName: "Bob",
          familyName: "Test",
          role: "student",
          enabledUser: true,
          email: "bob.test@example.com",
          grades: ["1st Grade"],
          metadata: { age: 6 }
          // Missing orgs
        },
        expectedStatus: 201,
        expectedError: 'orgs'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      try {
        const response = await axios.post(`${this.baseURL}/ims/oneroster/rostering/v1p2/users`, testCase.data, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': this.cookies
          },
          validateStatus: () => true
        });

        console.log(`📥 Status: ${response.status} (expected: ${testCase.expectedStatus})`);
        console.log(`📝 Error: ${response.data.error?.message || 'No error message'}`);
        console.log(`📝 Created: ${!!response.data.user}`);
        
        const statusMatch = response.status === testCase.expectedStatus;
        // For successful creation (201), we check that user was created
        // For validation errors (400), we check error message
        const passed = testCase.expectedStatus === 201 ? (statusMatch && response.data.user) : 
                      (statusMatch && response.data.error?.message?.includes(testCase.expectedError));
        
        if (passed) {
          console.log('✅ PASSED - Test working correctly');
        } else {
          console.log('❌ FAILED - Test not working as expected');
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
      const response = await axios.get(`${this.baseURL}/ims/oneroster/rostering/v1p2/users`, {
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
        console.log(`- User has orgs: ${parentUser.orgs?.length > 0}`);
        console.log(`- Role is parent/teacher: ${parentUser.role === 'parent' || parentUser.role === 'teacher'}`);
        console.log(`- Orgs count: ${parentUser.orgs?.length || 0}`);
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
      const filterQuery = `metadata.parentId='${this.userId}'&role='student'`;
      const response = await axios.get(`${this.baseURL}/ims/oneroster/rostering/v1p2/users?filter=${encodeURIComponent(filterQuery)}`, {
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
        console.log(`- All have parent ID: ${children.every(c => c.metadata?.parentId === this.userId)}`);
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
      const sortQuery = `metadata.parentId='${this.userId}'&sort=name&order=asc`;
      const response = await axios.get(`${this.baseURL}/ims/oneroster/rostering/v1p2/users?filter=${encodeURIComponent(sortQuery)}`, {
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
      const paginationQuery = `metadata.parentId='${this.userId}'&limit=1&offset=0`;
      const response = await axios.get(`${this.baseURL}/ims/oneroster/rostering/v1p2/users?filter=${encodeURIComponent(paginationQuery)}`, {
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
      const combinedQuery = `metadata.parentId='${this.userId}'&role='student'&sort=name&order=desc&limit=5`;
      const response = await axios.get(`${this.baseURL}/ims/oneroster/rostering/v1p2/users?filter=${encodeURIComponent(combinedQuery)}`, {
        headers: { 'Cookie': this.cookies },
        validateStatus: () => true
      });

      console.log(`📥 Combined Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Combined filters working:');
        console.log(`- Parent ID filter: ${response.data.filters?.parentId === this.userId}`);
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
const baseURL = args[0] || 'http://localhost:8080';

// Run the tester
const tester = new OneRosterAPITester(baseURL);
tester.runTests().catch(console.error);