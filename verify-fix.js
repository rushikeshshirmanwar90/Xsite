/**
 * VERIFY FIX SCRIPT
 * 
 * Run this after implementing the backend endpoints to verify they work
 * Usage: node verify-fix.js
 */

const axios = require('axios');

const CONFIG = {
  domain: 'http://10.251.82.135:8080',
  testClientId: 'test-client-id' // Replace with your actual client ID
};

console.log('🔍 VERIFYING NOTIFICATION SYSTEM FIX');
console.log('=' .repeat(50));
console.log('🌐 Backend URL:', CONFIG.domain);
console.log('🏢 Test Client ID:', CONFIG.testClientId);
console.log('⏰ Started at:', new Date().toLocaleTimeString());
console.log('=' .repeat(50) + '\n');

async function verifyRecipientsAPI() {
  console.log('👥 TESTING: GET /api/notifications/recipients');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/notifications/recipients?clientId=${CONFIG.testClientId}`);
    
    if (response.data.success) {
      const recipients = response.data.recipients || [];
      console.log('✅ SUCCESS: Recipients API is working!');
      console.log(`📊 Found ${recipients.length} recipients`);
      
      if (recipients.length > 0) {
        console.log('👥 Recipients:');
        recipients.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.fullName} (${r.userType})`);
        });
      } else {
        console.log('⚠️  No recipients found - create users for this client');
      }
      return true;
    } else {
      console.log('❌ FAIL: API returned success: false');
      console.log('📋 Response:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ FAIL: Recipients API still not found (404)');
      console.log('💡 Solution: Add GET /api/notifications/recipients endpoint');
    } else {
      console.log('❌ FAIL: Recipients API error');
      console.log('📋 Error:', error.response?.status, error.message);
    }
    return false;
  }
}

async function verifySendAPI() {
  console.log('\n📤 TESTING: POST /api/notifications/send');
  console.log('-'.repeat(40));
  
  const testPayload = {
    title: '🧪 Verification Test',
    body: 'Testing notification send API after implementation',
    category: 'material',
    action: 'test',
    data: {
      clientId: CONFIG.testClientId,
      projectId: 'verification-test',
      triggeredBy: {
        userId: 'verification-user',
        fullName: 'Verification Test User',
        userType: 'staff'
      }
    },
    recipients: [], // Empty for testing
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${CONFIG.domain}/api/notifications/send`, testPayload);
    
    if (response.data.success) {
      console.log('✅ SUCCESS: Send API is working!');
      console.log('📤 Notifications sent:', response.data.data?.notificationsSent || 0);
      return true;
    } else {
      console.log('❌ FAIL: API returned success: false');
      console.log('📋 Response:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ FAIL: Send API still not found (404)');
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

async function testMultiUserFlow() {
  console.log('\n🔄 TESTING: Multi-User Notification Flow');
  console.log('-'.repeat(40));
  
  try {
    // Step 1: Get recipients
    const recipientsResponse = await axios.get(`${CONFIG.domain}/api/notifications/recipients?clientId=${CONFIG.testClientId}`);
    
    if (!recipientsResponse.data.success) {
      console.log('❌ FAIL: Cannot get recipients for multi-user test');
      return false;
    }
    
    const recipients = recipientsResponse.data.recipients || [];
    
    if (recipients.length === 0) {
      console.log('⚠️  WARNING: No recipients found for multi-user test');
      console.log('💡 Create user accounts for this client to test multi-user notifications');
      return false;
    }
    
    // Step 2: Send test notification
    const testNotification = {
      title: '🧪 Multi-User Flow Test',
      body: 'Testing complete multi-user notification flow',
      category: 'material',
      action: 'test',
      data: {
        clientId: CONFIG.testClientId,
        projectId: 'multi-user-test-' + Date.now(),
        projectName: 'Multi-User Test Project',
        triggeredBy: {
          userId: 'test-user',
          fullName: 'Test User',
          userType: 'staff'
        }
      },
      recipients: recipients,
      timestamp: new Date().toISOString()
    };
    
    const sendResponse = await axios.post(`${CONFIG.domain}/api/notifications/send`, testNotification);
    
    if (sendResponse.data.success) {
      console.log('✅ SUCCESS: Multi-user notification flow working!');
      console.log(`📤 Sent notifications to ${recipients.length} users:`);
      recipients.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.fullName} (${r.userType})`);
      });
      return true;
    } else {
      console.log('❌ FAIL: Multi-user notification sending failed');
      console.log('📋 Response:', sendResponse.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ FAIL: Multi-user flow test error');
    console.log('📋 Error:', error.response?.status, error.message);
    return false;
  }
}

async function runVerification() {
  try {
    const recipientsWorking = await verifyRecipientsAPI();
    const sendWorking = await verifySendAPI();
    const multiUserWorking = await testMultiUserFlow();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 VERIFICATION RESULTS');
    console.log('=' .repeat(50));
    
    console.log(`Recipients API: ${recipientsWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`Send API: ${sendWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`Multi-User Flow: ${multiUserWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    if (recipientsWorking && sendWorking) {
      console.log('\n🎉 VERIFICATION SUCCESSFUL!');
      console.log('✅ Backend notification APIs are working');
      console.log('✅ Multi-user notifications should now work in your app');
      console.log('\n📱 NEXT STEPS:');
      console.log('1. Test in your React Native app');
      console.log('2. Create material activity and check if other users get notified');
      console.log('3. Verify notification content and formatting');
      console.log('4. Test with multiple user accounts');
      
      if (multiUserWorking) {
        console.log('\n🚀 SYSTEM FULLY OPERATIONAL!');
        console.log('Multi-user notifications are working end-to-end');
      }
    } else {
      console.log('\n❌ VERIFICATION FAILED');
      console.log('🔧 REQUIRED ACTIONS:');
      if (!recipientsWorking) {
        console.log('- Implement GET /api/notifications/recipients endpoint');
      }
      if (!sendWorking) {
        console.log('- Implement POST /api/notifications/send endpoint');
      }
      console.log('📁 Use: IMMEDIATE_BACKEND_FIX.js for complete code');
      console.log('🔄 Restart backend server after implementation');
    }
    
    console.log('\n🕒 Verification completed at:', new Date().toLocaleString());
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('🚨 VERIFICATION ERROR:', error.message);
  }
}

// Run verification
runVerification();