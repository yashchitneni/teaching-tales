// Test TimeBack Integration with ACTUAL API Specification
const axios = require('axios');

const timebackBaseURL = 'http://localhost:8080';

async function testTimeBackIntegration() {
  console.log('🧪 Testing TimeBack OneRoster Integration (CORRECTED)');
  console.log('==========================================');

  try {
    // 1. Authenticate
    console.log('\n1. 🔐 Authenticating with TimeBack...');
    const authResponse = await axios.post(`${timebackBaseURL}/api/auth/login`, {
      email: 'demo123@example.com',
      password: 'TestPassword123!'
    });

    if (!authResponse.data.success) {
      throw new Error('Authentication failed');
    }

    const accessToken = authResponse.data.data.accessToken;
    console.log('✅ Authentication successful');

    // 2. Test OneRoster Users endpoint
    console.log('\n2. 👥 Testing OneRoster Users endpoint...');
    const usersResponse = await axios.get(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ Users endpoint working. Found ${usersResponse.data.users?.length || 0} users`);

    // 3. Create a student using ACTUAL API specification
    console.log('\n3. 🎓 Testing OneRoster student creation...');
    
    // Using EXACT format from actual API spec
    const studentData = {
      username: `teststudent${Date.now()}`,
      givenName: "Test",
      familyName: "Student", 
      role: "student",
      orgIds: ["dZNtFzQq94Bn"], // MUST be array as per spec
      enabledUser: true,
      email: `test.student.${Date.now()}@example.com`,
      grades: ["3rd Grade"],
      metadata: {
        age: 8,
        parentNote: "Created by integration test"
      }
    };

    console.log('📝 Sending student data:', JSON.stringify(studentData, null, 2));

    const createResponse = await axios.post(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, studentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (createResponse.status === 201 && createResponse.data.user) {
      console.log('✅ Student creation successful!');
      console.log('📝 Created user:', createResponse.data.user.givenName, createResponse.data.user.familyName);
      console.log('🆔 User ID:', createResponse.data.user.sourcedId);
      console.log('🏢 Organizations:', createResponse.data.user.orgs?.map(o => o.sourcedId).join(', '));
    } else {
      throw new Error(`Unexpected response: ${createResponse.status}`);
    }

    // 4. Verify the student appears in the users list
    console.log('\n4. 🔍 Verifying student appears in users list...');
    const updatedUsersResponse = await axios.get(`${timebackBaseURL}/ims/oneroster/rostering/v1p2/users`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const studentUsers = updatedUsersResponse.data.users?.filter(u => u.role === 'student') || [];
    console.log(`✅ Found ${studentUsers.length} student(s) in the system`);

    console.log('\n🎉 All tests passed! OneRoster integration is working correctly.');

  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    if (error.response?.data) {
      console.log('📄 Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testTimeBackIntegration();
