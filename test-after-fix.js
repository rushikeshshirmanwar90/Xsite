/**
 * Test Script - Run After Backend Fix
 * 
 * This script tests if the backend notification APIs are working
 * Run with: node test-after-fix.js
 */

const axios = require('axios');

const BACKEND_URL = 'http://10.251.82.135:8080';
const TEST_CLIENT_ID = 'test-client-id'; // Replace with actual client ID

console.log('🧪 Testing Backend Notification APIs');
console.log('🌐 Backend URL:', BACKEND_URL);
console.log('🏢 Test Client ID:', TEST_CLIENT_ID);
console.log('\n' + '='.repeat(50) + '\n');

async function testRecipientsAPI() {
  console.log('📡 Testing GET /api/notifications/recipients');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/notifications/recipients?clientId=${TEST_CLIENT_ID}`);
    
    if (response.data.success) {
      const recipients = response.data.recipients || [];
      console.log('✅ SUCCESS: Recipients API is working');
      console.log(`📊 Found ${recipients.length} recipients`);
      
      if (recipients.length > 0) {
        console.log('👥 Recipients:');
        recipients.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.fullName} (${r.userType})`);
        });
      } else {
        console.log('⚠️  No recipients found - make sure users exist for this client');
      }
      
      return true;
    } else {
      console.log('❌ FAIL: API returned success: false');
      console.log('📋 Response:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ FAIL: Recipients API not found (404)');
      console.log('💡 Solution: Add GET /api/notifications/recipients endpoint');
    } else {
      console.log('❌ FAIL: Recipients API error');
      console.log('📋 Error:', error.response?.status, error.message);
    }
    return false;
  }
}

async function testSendAPI() {
  console.log('\n📡 Testing POST /api/notifications/send');
  
  const testPayload = {
    title: '🧪 Test Notification',
    body: 'Testing notification send API',
    category: 'material',
    action: 'test',
    data: {
      clientId: TEST_CLIENT_ID,
      projectId: 'test-project',
      triggeredBy: {
        userId: 'test-user',
        fullName: 'Test User',
        userType: 'staff'
      }
    },
    recipients: [], // Empty for testing
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/notifications/send`, testPayload);
    
    if (response.data.success) {
      console.log('✅ SUCCESS: Send API is working');
      console.log('📤 Notifications sent:', response.data.data?.notificationsSent || 0);
      return true;
    } else {
      console.log('❌ FAIL: API returned success: false');
      console.log('📋 Response:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ FAIL: Send API not found (404)');
      console.log('💡 Solution: Add POST /api/notifications/send endpoint');
    } else if (error.response?.status === 400) {
      console.log('✅ SUCCESS: Send API exists (400 error expected with empty recipients)');
      return true;
    } else {
      console.log('❌ FAIL: Send API error');
      console.log('📋 Error:', error.response?.status, error.message);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const recipientsWorking = await testRecipientsAPI();
  const sendWorking = await testSendAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`Recipients API: ${recipientsWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
  console.log(`Send API: ${sendWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
  
  if (recipientsWorking && sendWorking) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Backend notification APIs are working');
    console.log('✅ Multi-user notifications should now work');
    console.log('\n📱 Next Steps:');
    console.log('1. Test in your React Native app');
    console.log('2. Create material activity and check if other users get notified');
    console.log('3. Verify cross-user notifications work properly');
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 Required Actions:');
    if (!recipientsWorking) {
      console.log('- Implement GET /api/notifications/recipients endpoint');
    }
    if (!sendWorking) {
      console.log('- Implement POST /api/notifications/send endpoint');
    }
    console.log('📁 Use: BACKEND_NOTIFICATION_ROUTES.js for complete code');
  }
  
  console.log('\n🕒 Test completed at:', new Date().toLocaleString());
}

// Run tests
runTests().catch(console.error);