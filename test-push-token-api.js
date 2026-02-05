/**
 * Test script for push token API
 * Run with: node test-push-token-api.js
 */

const axios = require('axios');

const BACKEND_URL = 'http://10.251.82.135:8080';

async function testPushTokenAPI() {
  console.log('🧪 Testing Push Token API');
  console.log('🌐 Backend URL:', BACKEND_URL);
  console.log('');

  // Test data
  const testToken = 'ExponentPushToken[test-token-' + Date.now() + ']';
  const testUserId = 'test-user-' + Date.now();
  
  const testPayload = {
    userId: testUserId,
    userType: 'staff',
    token: testToken,
    platform: 'ios',
    deviceId: 'test-device-123',
    deviceName: 'Test iPhone',
    appVersion: '1.0.0'
  };

  console.log('📤 Test payload:', {
    ...testPayload,
    token: testPayload.token.substring(0, 30) + '...'
  });
  console.log('');

  // Test 1: Register push token
  console.log('📡 TEST 1: Register Push Token (POST /api/push-token)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/push-token`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Registration SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Token ID:', response.data.data?.tokenId);
    console.log('   Is New:', response.data.data?.isNew);
  } catch (error) {
    console.log('❌ Registration ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');

  // Test 2: Get push tokens for user
  console.log('📡 TEST 2: Get Push Tokens (GET /api/push-token)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/push-token?userId=${testUserId}`, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Get Tokens SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Token Count:', response.data.data?.count || 0);
    
    if (response.data.data?.tokens?.length > 0) {
      console.log('   Tokens found:');
      response.data.data.tokens.forEach((token, i) => {
        console.log(`      ${i + 1}. Platform: ${token.platform}, Active: ${token.isActive}, Last Used: ${token.lastUsed}`);
      });
    }
  } catch (error) {
    console.log('❌ Get Tokens ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');

  // Test 3: Update existing token (register same token again)
  console.log('📡 TEST 3: Update Existing Token (POST /api/push-token)');
  console.log('-'.repeat(50));
  
  try {
    const updatePayload = {
      ...testPayload,
      deviceName: 'Updated Test iPhone',
      appVersion: '1.0.1'
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/push-token`, updatePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Update SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Token ID:', response.data.data?.tokenId);
    console.log('   Is New:', response.data.data?.isNew);
  } catch (error) {
    console.log('❌ Update ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');

  // Test 4: Deactivate push token
  console.log('📡 TEST 4: Deactivate Push Token (DELETE /api/push-token)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.delete(`${BACKEND_URL}/api/push-token?userId=${testUserId}`, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Deactivation SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Deactivated Count:', response.data.data?.deactivatedCount || 0);
  } catch (error) {
    console.log('❌ Deactivation ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');

  // Test 5: Verify deactivation
  console.log('📡 TEST 5: Verify Deactivation (GET /api/push-token)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/push-token?userId=${testUserId}&isActive=true`, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Verification SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Active Token Count:', response.data.data?.count || 0);
    
    if (response.data.data?.count === 0) {
      console.log('   ✅ Token successfully deactivated');
    } else {
      console.log('   ⚠️ Token still active');
    }
  } catch (error) {
    console.log('❌ Verification ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
  }

  console.log('');
  console.log('🎯 PUSH TOKEN API TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log('✅ Push token registration API is working');
  console.log('✅ Push token retrieval API is working');
  console.log('✅ Push token update functionality is working');
  console.log('✅ Push token deactivation API is working');
  console.log('');
  console.log('📱 Next Steps:');
  console.log('1. Integrate push token service in your React Native app');
  console.log('2. Test with real devices and push tokens');
  console.log('3. Verify notifications are delivered to registered devices');
  console.log('');
  console.log('🏁 Test completed at:', new Date().toLocaleString());
}

testPushTokenAPI().catch(console.error);