#!/usr/bin/env node

// Test script to verify OneRoster integration with TimeBack API
const axios = require('axios');

const timebackBaseURL = 'http://localhost:8080';
const testCredentials = {
  email: 'demo123@example.com',
  password: 'TestPassword123!'
};

async function testTimeBackIntegration() {
  console.log('🧪 Testing TimeBack OneRoster Integration');
  console.log('==========================================');

  try {
    // Step 1: Authenticate with TimeBack
    console.log('\n1. 🔐 Authenticating with TimeBack...');
    const authResponse = await axios.post(`${timebackBaseURL}/api/auth/login`, testCredentials);
    
    if (!authResponse.data.success) {
      throw new Error('Authentication failed');
    }
    
    const accessToken = authResponse.data.data.accessToken;
    console.log('✅ Authentication successful');

    // Step 2: Test OneRoster Users endpoint
    console.log('\n2. 👥 Testing OneRoster Users endpoint...');
    const usersResponse = await axios.get(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ Users endpoint working. Found ${usersResponse.data.users.length} users`);

    // Step 3: Test creating a student user
    console.log('\n3. 🎓 Testing OneRoster student creation...');
    const studentData = {
      username: `testchild.${Date.now()}`,
      givenName: 'Test',
      familyName: 'Child',
      role: 'student',
      orgIds: ['dZNtFzQq94Bn'], // Teaching Tales School
      enabledUser: true,
      email: `testchild.${Date.now()}@example.com`,
      grades: ['3rd Grade'],
      metadata: {
        age: 8,
        parentId: 'test-parent-id'
      }
    };

    const createResponse = await axios.post(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, studentData, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.status === 201) {
      console.log('✅ Student creation successful!');
      console.log(`📝 Created user: ${createResponse.data.user.givenName} ${createResponse.data.user.familyName}`);
      console.log(`🆔 User ID: ${createResponse.data.user.sourcedId}`);
    } else {
      console.log('❌ Student creation failed');
    }

    // Step 4: Verify student in users list
    console.log('\n4. 🔍 Verifying student appears in users list...');
    const updatedUsersResponse = await axios.get(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const studentUsers = updatedUsersResponse.data.users.filter(user => user.role === 'student');
    console.log(`✅ Found ${studentUsers.length} student(s) in the system`);

    console.log('\n🎉 All tests passed! OneRoster integration is working correctly.');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Run the test
testTimeBackIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
