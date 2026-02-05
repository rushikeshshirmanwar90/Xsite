const axios = require('axios');

const BASE_URL = 'http://10.251.82.135:8080';

async function testDifferentClientIds() {
  console.log('🔍 Testing different client IDs to find one with users...');
  
  // Test client IDs that were mentioned in the logs
  const testClientIds = [
    '696628376ab23e555cced2b8',
    '696f2e4632b5cb62087902af', 
    '69662bf7f553c383d7324116',
    '696fa06361771536cb3cb593'
  ];
  
  for (const clientId of testClientIds) {
    try {
      console.log(`\nTesting clientId: ${clientId}`);
      const response = await axios.get(`${BASE_URL}/api/notifications/recipients`, {
        params: { clientId },
        timeout: 10000
      });
      
      if (response.data.success) {
        const recipients = response.data.data.recipients;
        console.log(`✅ Found ${recipients.length} recipients for client ${clientId}`);
        
        if (recipients.length > 0) {
          console.log('📋 Recipients:');
          recipients.forEach((r, i) => {
            console.log(`  ${i+1}. ${r.fullName} (${r.userType}) - ${r.email}`);
          });
          
          // Test sending notification to this client
          console.log(`\n📤 Testing notification send for client ${clientId}...`);
          const sendResponse = await axios.post(`${BASE_URL}/api/notifications/send`, {
            title: '🧪 Test Notification',
            body: 'Testing notification system with real recipients',
            category: 'material_activity',
            action: 'material_added',
            recipients: recipients,
            data: { clientId, projectId: 'test-123' },
            timestamp: new Date().toISOString()
          });
          
          if (sendResponse.data.success) {
            const result = sendResponse.data.data;
            console.log(`✅ Notification sent successfully!`);
            console.log(`   - Sent: ${result.notificationsSent}`);
            console.log(`   - Failed: ${result.notificationsFailed}`);
            
            console.log(`\n🎯 WORKING CLIENT ID FOUND: ${clientId}`);
            console.log('This client ID has users and notifications work!');
            return clientId;
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error testing client ${clientId}: ${error.message}`);
    }
  }
  
  console.log('\n❌ No client IDs found with recipients');
  console.log('This might mean:');
  console.log('1. Database is empty or has no users');
  console.log('2. Client IDs in test are not valid');
  console.log('3. Users are not properly assigned to clients');
  
  return null;
}

// Also test if we can find any clients at all
async function testFindAnyClients() {
  console.log('\n🔍 Trying to find any clients in the system...');
  
  try {
    // Try to get some admin users to see what client IDs exist
    const response = await axios.get(`${BASE_URL}/api/users`, {
      timeout: 10000
    });
    
    console.log('Users API response:', response.data);
  } catch (error) {
    console.log('❌ Could not fetch users:', error.message);
  }
  
  try {
    // Try to get some staff users
    const response = await axios.get(`${BASE_URL}/api/admin`, {
      timeout: 10000
    });
    
    console.log('Admin API response:', response.data);
  } catch (error) {
    console.log('❌ Could not fetch admin data:', error.message);
  }
}

async function runTest() {
  console.log('🚀 FINDING WORKING CLIENT ID FOR NOTIFICATION TESTING\n');
  
  const workingClientId = await testDifferentClientIds();
  
  if (!workingClientId) {
    await testFindAnyClients();
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Check if users exist in the database');
    console.log('2. Ensure users have proper clientId assignments');
    console.log('3. Create test users if database is empty');
    console.log('4. Verify database connection is working');
  }
}

runTest().catch(console.error);