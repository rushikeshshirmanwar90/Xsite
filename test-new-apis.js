/**
 * Quick test script for new notification APIs
 */

const axios = require('axios');

const BACKEND_URL = 'http://10.251.82.135:8080';
const TEST_CLIENT_ID = 'test-client-id';

async function testNewAPIs() {
  console.log('🧪 Testing New Notification APIs');
  console.log('🌐 Backend URL:', BACKEND_URL);
  console.log('');

  // Test 1: Recipients API
  console.log('📡 Testing GET /api/notifications/recipients');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/notifications/recipients?clientId=${TEST_CLIENT_ID}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Recipients API SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Recipients:', response.data.data?.recipients?.length || 0);
    console.log('   Message:', response.data.message);
  } catch (error) {
    console.log('❌ Recipients API ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');

  // Test 2: Send API
  console.log('📡 Testing POST /api/notifications/send');
  const testPayload = {
    title: '🧪 Test Notification',
    body: 'Testing notification send API',
    category: 'material',
    action: 'test',
    data: {
      clientId: TEST_CLIENT_ID,
      projectId: 'test-project'
    },
    recipients: [],
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.post(`${BACKEND_URL}/api/notifications/send`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Send API SUCCESS:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Notifications Sent:', response.data.data?.notificationsSent || 0);
    console.log('   Message:', response.data.message);
  } catch (error) {
    console.log('❌ Send API ERROR:');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Message:', error.message);
    if (error.response?.data) {
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('');
  console.log('🏁 Test completed at:', new Date().toLocaleString());
}

testNewAPIs().catch(console.error);