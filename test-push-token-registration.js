/**
 * Test Push Token Registration
 * 
 * This script tests the push token registration system to ensure
 * users can receive notifications properly.
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8080';

// Test user IDs from your logs
const TEST_USER_IDS = [
  '696628376ab23e555cced2b8',
  '696f2e4632b5cb62087902af',
  '69662bf7f553c383d7324116',
  '696fa06361771536cb3cb593',
  '696662fe599a5f02adfc99b2'
];

async function testPushTokenRegistration() {
  console.log('🧪 Testing Push Token Registration System');
  console.log('=' .repeat(50));

  try {
    // 1. Check current token status
    console.log('\n📊 1. Checking current push token status...');
    
    const tokenResponse = await axios.get(`${BACKEND_URL}/api/push-token/status`, {
      timeout: 10000
    });
    
    console.log('✅ Token status response:', tokenResponse.data);
    
    // 2. Check tokens for specific users
    console.log('\n🔍 2. Checking tokens for specific users...');
    
    for (const userId of TEST_USER_IDS) {
      try {
        const userTokenResponse = await axios.get(`${BACKEND_URL}/api/push-token?userId=${userId}`, {
          timeout: 5000
        });
        
        console.log(`   User ${userId.substring(0, 8)}...: ${userTokenResponse.data.success ? 'HAS TOKEN' : 'NO TOKEN'}`);
        if (userTokenResponse.data.data) {
          console.log(`     Token: ${userTokenResponse.data.data.token.substring(0, 30)}...`);
          console.log(`     Platform: ${userTokenResponse.data.data.platform}`);
          console.log(`     Active: ${userTokenResponse.data.data.isActive}`);
        }
      } catch (userError) {
        console.log(`   User ${userId.substring(0, 8)}...: ERROR - ${userError.message}`);
      }
    }

    // 3. Test notification sending
    console.log('\n📱 3. Testing notification sending...');
    
    const testNotification = {
      title: 'Test Notification',
      body: 'This is a test notification to verify the system is working',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      },
      recipients: TEST_USER_IDS
    };

    const notificationResponse = await axios.post(`${BACKEND_URL}/api/notifications/send`, testNotification, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ Notification send response:', notificationResponse.data);

    // 4. Summary
    console.log('\n📋 4. Summary:');
    console.log(`   - Backend URL: ${BACKEND_URL}`);
    console.log(`   - Users tested: ${TEST_USER_IDS.length}`);
    console.log(`   - Notification sent: ${notificationResponse.data.success ? 'YES' : 'NO'}`);
    
    if (notificationResponse.data.data) {
      console.log(`   - Successful deliveries: ${notificationResponse.data.data.successful || 0}`);
      console.log(`   - Failed deliveries: ${notificationResponse.data.data.failed || 0}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testPushTokenRegistration();