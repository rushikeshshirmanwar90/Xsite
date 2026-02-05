/**
 * Test script to add sample notifications and verify the notification display system
 */

const axios = require('axios');

const domain = "http://localhost:8080";

async function addTestNotifications() {
  console.log('🧪 Adding Test Notifications to Verify Display System');
  console.log('====================================================');

  try {
    // Test 1: Create a material activity to trigger backend notifications
    console.log('\n📋 Test 1: Creating Material Activity to Trigger Notifications');
    console.log('--------------------------------------------------------------');

    const testMaterialActivity = {
      clientId: 'test_client_display_' + Date.now(),
      projectId: 'test_project_display_' + Date.now(),
      projectName: 'Display Test Project',
      sectionName: 'Foundation',
      miniSectionName: 'Footing',
      activity: 'imported',
      user: {
        userId: 'test_user_display_' + Date.now(),
        fullName: 'Display Test User'
      },
      materials: [
        {
          name: 'Display Test Cement',
          unit: 'bags',
          qnt: 15,
          cost: 450,
          perUnitCost: 30,
          totalCost: 450,
          specs: {
            grade: 'OPC 53',
            brand: 'Display Test Brand'
          }
        }
      ],
      message: 'Testing notification display system',
      date: new Date().toISOString()
    };

    console.log('📤 Creating material activity...');
    const activityResponse = await axios.post(
      `${domain}/api/materialActivity`,
      testMaterialActivity,
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (activityResponse.data.success) {
      console.log('✅ Material activity created successfully');
      console.log('📊 Activity ID:', activityResponse.data.data._id);
      
      // Wait for notification processing
      console.log('⏳ Waiting for notification processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check retry queue
      const retryCheck = await axios.get(`${domain}/api/notifications/retry`, { timeout: 5000 });
      console.log('📊 Retry queue status:', {
        totalInQueue: retryCheck.data.data?.statistics?.totalInQueue || 0,
        circuitBreakerState: retryCheck.data.data?.statistics?.circuitBreakerState
      });
      
    } else {
      console.error('❌ Material activity creation failed:', activityResponse.data.message);
    }

    // Test 2: Create transfer activity
    console.log('\n📋 Test 2: Creating Transfer Activity');
    console.log('-------------------------------------');

    const transferActivity = {
      clientId: testMaterialActivity.clientId,
      projectId: testMaterialActivity.projectId + '_dest',
      projectName: 'Display Test Destination Project',
      activity: 'transferred',
      user: testMaterialActivity.user,
      materials: [
        {
          name: 'Transferred Display Test Steel',
          unit: 'tons',
          qnt: 1,
          cost: 50000,
          perUnitCost: 50000,
          totalCost: 50000,
        }
      ],
      transferDetails: {
        fromProject: {
          id: testMaterialActivity.projectId + '_source',
          name: 'Display Test Source Project'
        },
        toProject: {
          id: testMaterialActivity.projectId + '_dest',
          name: 'Display Test Destination Project'
        }
      },
      message: 'Testing transfer notification display',
      date: new Date().toISOString()
    };

    const transferResponse = await axios.post(
      `${domain}/api/materialActivity`,
      transferActivity,
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (transferResponse.data.success) {
      console.log('✅ Transfer activity created successfully');
      console.log('📊 Transfer ID:', transferResponse.data.data._id);
    } else {
      console.error('❌ Transfer activity creation failed:', transferResponse.data.message);
    }

    // Test 3: Test push token registration
    console.log('\n📋 Test 3: Testing Push Token Registration');
    console.log('------------------------------------------');

    const testPushToken = {
      userId: testMaterialActivity.user.userId,
      userType: 'staff',
      token: 'ExponentPushToken[display-test-token-' + Date.now() + ']',
      platform: 'android',
      deviceId: 'display-test-device',
      deviceName: 'Display Test Device',
      appVersion: '1.0.0'
    };

    const tokenResponse = await axios.post(
      `${domain}/api/push-token`,
      testPushToken,
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (tokenResponse.data.success) {
      console.log('✅ Push token registered successfully');
      console.log('📊 Token preview:', testPushToken.token.substring(0, 30) + '...');
    } else {
      console.error('❌ Push token registration failed:', tokenResponse.data.message);
    }

    console.log('\n🎉 Test Notifications Created Successfully!');
    console.log('==========================================');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('1. Open the Xsite app');
    console.log('2. Navigate to the Notifications screen');
    console.log('3. You should see test notifications if the system is working');
    console.log('');
    console.log('💡 Note: Since we\'re using test data, the notifications won\'t be delivered');
    console.log('   via push notifications, but the backend processing should work.');
    console.log('');
    console.log('🔧 To see notifications in the app:');
    console.log('   - Use the local notification test feature in the app');
    console.log('   - Or add real project/user data to the database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
addTestNotifications().catch(console.error);