const axios = require('axios');

async function testMaterialActivityNotification() {
  console.log('🧪 Testing material activity notification with correct client ID...');
  
  const BASE_URL = 'http://10.251.82.135:8080';
  const CORRECT_CLIENT_ID = '695f818566b3d06dfb6083f2'; // Client ID that has 23 users
  
  // Create a test material activity
  const testActivity = {
    clientId: CORRECT_CLIENT_ID,
    projectId: 'test-project-123',
    projectName: 'Test Project',
    sectionName: 'Test Section',
    materials: [
      {
        name: 'Test Cement',
        unit: 'bags',
        qnt: 10,
        cost: 5000,
        totalCost: 5000
      }
    ],
    message: 'Testing notification system with correct client ID',
    activity: 'imported',
    user: {
      userId: 'test-user-123',
      fullName: 'Test User'
    },
    date: new Date().toISOString()
  };
  
  try {
    console.log('📤 Sending test material activity...');
    console.log('   - Client ID:', CORRECT_CLIENT_ID);
    console.log('   - Expected recipients: 23 users (2 admins + 21 staff)');
    
    const response = await axios.post(`${BASE_URL}/api/materialActivity`, testActivity, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    if (response.data.success) {
      console.log('✅ Material activity created successfully!');
      console.log('📋 Activity ID:', response.data.data._id);
      console.log('');
      console.log('🔍 Check the server logs for notification processing...');
      console.log('You should see:');
      console.log('  - "🔔 Processing material activity notification..."');
      console.log('  - "📋 Getting notification recipients from API..."');
      console.log('  - "✅ Found 23 notification recipients"');
      console.log('  - "📱 Sending notifications to user IDs: [...]"');
      console.log('  - "✅ Material activity notification sent: X messages"');
      console.log('');
      console.log('🎯 If you see "📭 No active push tokens found", that means:');
      console.log('   - The notification system is working correctly');
      console.log('   - Recipients are found (23 users)');
      console.log('   - But no mobile devices have registered push tokens yet');
      console.log('   - This is expected until users login on mobile and grant permissions');
    } else {
      console.log('❌ Failed to create material activity:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error testing material activity:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testMaterialActivityNotification();