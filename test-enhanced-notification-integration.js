/**
 * Enhanced Notification System Integration Test for Xsite
 * 
 * This test verifies that the Xsite app properly integrates with the enhanced
 * notification system implemented in the real-estate-apis backend.
 */

const axios = require('axios');

// Use local development server
const domain = "http://localhost:8080";

// Test configuration
const TEST_CONFIG = {
  domain,
  timeout: 15000,
  testClientId: 'test_client_enhanced_' + Date.now(),
  testProjectId: 'test_project_enhanced_' + Date.now(),
  testUserId: 'test_user_enhanced_' + Date.now(),
};

console.log('🧪 Enhanced Notification System Integration Test');
console.log('================================================');
console.log('🌐 Testing against domain:', TEST_CONFIG.domain);
console.log('📋 Test Configuration:', {
  clientId: TEST_CONFIG.testClientId,
  projectId: TEST_CONFIG.testProjectId,
  userId: TEST_CONFIG.testUserId,
});

/**
 * Test 1: Verify Enhanced Notification Service Endpoints
 */
async function testEnhancedNotificationEndpoints() {
  console.log('\n📋 Test 1: Enhanced Notification Service Endpoints');
  console.log('--------------------------------------------------');

  try {
    // Test recipient resolution endpoint
    console.log('🔍 Testing recipient resolution endpoint...');
    const recipientResponse = await axios.get(
      `${TEST_CONFIG.domain}/api/notifications/recipients?clientId=${TEST_CONFIG.testClientId}`,
      { timeout: TEST_CONFIG.timeout }
    );

    console.log('✅ Recipient resolution endpoint accessible');
    console.log('📊 Response structure:', {
      success: recipientResponse.data.success,
      hasData: !!recipientResponse.data.data,
      source: recipientResponse.data.data?.source,
      recipientCount: recipientResponse.data.data?.recipientCount || 0,
    });

    // Test retry management endpoint
    console.log('🔄 Testing retry management endpoint...');
    const retryResponse = await axios.get(
      `${TEST_CONFIG.domain}/api/notifications/retry`,
      { timeout: TEST_CONFIG.timeout }
    );

    console.log('✅ Retry management endpoint accessible');
    console.log('📊 Retry queue statistics:', {
      success: retryResponse.data.success,
      totalInQueue: retryResponse.data.data?.statistics?.totalInQueue || 0,
      circuitBreakerState: retryResponse.data.data?.statistics?.circuitBreakerState,
    });

    return true;
  } catch (error) {
    console.error('❌ Enhanced notification endpoints test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test 2: Create Material Activity with Enhanced Notifications
 */
async function testMaterialActivityWithNotifications() {
  console.log('\n📋 Test 2: Material Activity with Enhanced Notifications');
  console.log('--------------------------------------------------------');

  try {
    // Create test material activity
    const testMaterialActivity = {
      clientId: TEST_CONFIG.testClientId,
      projectId: TEST_CONFIG.testProjectId,
      projectName: 'Enhanced Test Project',
      sectionName: 'Foundation',
      miniSectionName: 'Footing',
      activity: 'imported',
      user: {
        userId: TEST_CONFIG.testUserId,
        fullName: 'Enhanced Test User'
      },
      materials: [
        {
          name: 'Enhanced Test Cement',
          unit: 'bags',
          qnt: 25,
          cost: 750,
          perUnitCost: 30,
          totalCost: 750,
          specs: {
            grade: 'OPC 53',
            brand: 'Enhanced Brand'
          }
        },
        {
          name: 'Enhanced Test Steel',
          unit: 'tons',
          qnt: 2,
          cost: 120000,
          perUnitCost: 60000,
          totalCost: 120000,
          specs: {
            grade: 'Fe500',
            diameter: '12mm'
          }
        }
      ],
      message: 'Testing enhanced notification system integration',
      date: new Date().toISOString()
    };

    console.log('📤 Creating material activity...');
    console.log('📋 Activity payload:', {
      clientId: testMaterialActivity.clientId,
      projectId: testMaterialActivity.projectId,
      activity: testMaterialActivity.activity,
      materialCount: testMaterialActivity.materials.length,
      totalCost: testMaterialActivity.materials.reduce((sum, m) => sum + m.cost, 0),
    });

    const activityResponse = await axios.post(
      `${TEST_CONFIG.domain}/api/materialActivity`,
      testMaterialActivity,
      { 
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (activityResponse.data.success) {
      console.log('✅ Material activity created successfully');
      console.log('📊 Activity details:', {
        id: activityResponse.data.data._id,
        activity: activityResponse.data.data.activity,
        materialCount: activityResponse.data.data.materials.length,
        projectId: activityResponse.data.data.projectId,
      });

      // Wait a moment for notification processing
      console.log('⏳ Waiting for notification processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check retry queue for any failed notifications
      const retryCheck = await axios.get(
        `${TEST_CONFIG.domain}/api/notifications/retry`,
        { timeout: TEST_CONFIG.timeout }
      );

      console.log('📊 Post-activity retry queue status:', {
        totalInQueue: retryCheck.data.data?.statistics?.totalInQueue || 0,
        readyForRetry: retryCheck.data.data?.statistics?.readyForRetry || 0,
        circuitBreakerState: retryCheck.data.data?.statistics?.circuitBreakerState,
      });

      return {
        success: true,
        activityId: activityResponse.data.data._id,
        retryQueueSize: retryCheck.data.data?.statistics?.totalInQueue || 0,
      };
    } else {
      console.error('❌ Material activity creation failed:', activityResponse.data.message);
      return { success: false };
    }

  } catch (error) {
    console.error('❌ Material activity with notifications test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return { success: false };
  }
}

/**
 * Test 3: Verify Push Token Integration
 */
async function testPushTokenIntegration() {
  console.log('\n📋 Test 3: Push Token Integration');
  console.log('----------------------------------');

  try {
    // Test push token registration endpoint
    const testPushToken = {
      userId: TEST_CONFIG.testUserId,
      userType: 'staff',
      token: 'ExponentPushToken[test-enhanced-token-' + Date.now() + ']',
      platform: 'android',
      deviceId: 'test-device-enhanced',
      deviceName: 'Enhanced Test Device',
      appVersion: '1.0.0'
    };

    console.log('📱 Testing push token registration...');
    const tokenResponse = await axios.post(
      `${TEST_CONFIG.domain}/api/push-token`,
      testPushToken,
      { 
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (tokenResponse.data.success) {
      console.log('✅ Push token registration successful');
      console.log('📊 Token details:', {
        userId: testPushToken.userId,
        userType: testPushToken.userType,
        platform: testPushToken.platform,
        tokenPreview: testPushToken.token.substring(0, 30) + '...',
      });

      // Test token validation
      console.log('🔍 Testing push token validation...');
      const validationResponse = await axios.get(
        `${TEST_CONFIG.domain}/api/push-token?userId=${TEST_CONFIG.testUserId}`,
        { timeout: TEST_CONFIG.timeout }
      );

      console.log('✅ Push token validation successful');
      console.log('📊 Validation result:', {
        found: validationResponse.data.success,
        tokenCount: validationResponse.data.data?.length || 0,
      });

      return true;
    } else {
      console.error('❌ Push token registration failed:', tokenResponse.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Push token integration test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test 4: Test Transfer Activity Notifications
 */
async function testTransferActivityNotifications() {
  console.log('\n📋 Test 4: Transfer Activity Notifications');
  console.log('-------------------------------------------');

  try {
    const transferActivity = {
      clientId: TEST_CONFIG.testClientId,
      projectId: TEST_CONFIG.testProjectId + '_dest',
      projectName: 'Enhanced Destination Project',
      activity: 'transferred',
      user: {
        userId: TEST_CONFIG.testUserId,
        fullName: 'Enhanced Transfer User'
      },
      materials: [
        {
          name: 'Transferred Enhanced Cement',
          unit: 'bags',
          qnt: 10,
          cost: 300,
          perUnitCost: 30,
          totalCost: 300,
        }
      ],
      transferDetails: {
        fromProject: {
          id: TEST_CONFIG.testProjectId + '_source',
          name: 'Enhanced Source Project'
        },
        toProject: {
          id: TEST_CONFIG.testProjectId + '_dest',
          name: 'Enhanced Destination Project'
        }
      },
      message: 'Testing enhanced transfer notification system',
      date: new Date().toISOString()
    };

    console.log('🔄 Creating transfer activity...');
    const transferResponse = await axios.post(
      `${TEST_CONFIG.domain}/api/materialActivity`,
      transferActivity,
      { 
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (transferResponse.data.success) {
      console.log('✅ Transfer activity created successfully');
      console.log('📊 Transfer details:', {
        id: transferResponse.data.data._id,
        fromProject: transferActivity.transferDetails.fromProject.name,
        toProject: transferActivity.transferDetails.toProject.name,
        materialCount: transferActivity.materials.length,
      });

      // Wait for notification processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;
    } else {
      console.error('❌ Transfer activity creation failed:', transferResponse.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Transfer activity notifications test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test 5: Verify Enhanced Error Handling
 */
async function testEnhancedErrorHandling() {
  console.log('\n📋 Test 5: Enhanced Error Handling');
  console.log('-----------------------------------');

  try {
    // Test with invalid data to trigger error handling
    const invalidActivity = {
      // Missing required fields to trigger validation errors
      clientId: '',
      projectId: '',
      activity: 'invalid_activity',
      materials: [],
    };

    console.log('🚫 Testing error handling with invalid data...');
    
    try {
      await axios.post(
        `${TEST_CONFIG.domain}/api/materialActivity`,
        invalidActivity,
        { 
          timeout: TEST_CONFIG.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.error('❌ Expected validation error but request succeeded');
      return false;
    } catch (validationError) {
      if (validationError.response && validationError.response.status >= 400 && validationError.response.status < 500) {
        console.log('✅ Validation error handled correctly');
        console.log('📊 Error response:', {
          status: validationError.response.status,
          message: validationError.response.data?.message || 'No message',
        });
        return true;
      } else {
        console.error('❌ Unexpected error type:', validationError.message);
        return false;
      }
    }

  } catch (error) {
    console.error('❌ Enhanced error handling test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  console.log('\n🚀 Starting Enhanced Notification System Integration Tests');
  console.log('=========================================================');

  const testResults = {
    enhancedEndpoints: false,
    materialActivityNotifications: false,
    pushTokenIntegration: false,
    transferNotifications: false,
    errorHandling: false,
  };

  try {
    // Run all tests
    testResults.enhancedEndpoints = await testEnhancedNotificationEndpoints();
    
    const materialResult = await testMaterialActivityWithNotifications();
    testResults.materialActivityNotifications = materialResult.success;
    
    testResults.pushTokenIntegration = await testPushTokenIntegration();
    testResults.transferNotifications = await testTransferActivityNotifications();
    testResults.errorHandling = await testEnhancedErrorHandling();

    // Print final results
    console.log('\n🏁 Integration Test Results');
    console.log('============================');
    console.log('✅ Enhanced Endpoints:', testResults.enhancedEndpoints ? 'PASS' : 'FAIL');
    console.log('✅ Material Activity Notifications:', testResults.materialActivityNotifications ? 'PASS' : 'FAIL');
    console.log('✅ Push Token Integration:', testResults.pushTokenIntegration ? 'PASS' : 'FAIL');
    console.log('✅ Transfer Notifications:', testResults.transferNotifications ? 'PASS' : 'FAIL');
    console.log('✅ Error Handling:', testResults.errorHandling ? 'PASS' : 'FAIL');

    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n📊 Overall Results:');
    console.log(`   Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All integration tests passed! Enhanced notification system is properly integrated.');
    } else {
      console.log('⚠️  Some integration tests failed. Please review the failures above.');
    }

    return testResults;

  } catch (error) {
    console.error('❌ Integration test suite failed:', error);
    return testResults;
  }
}

// Run the tests
runIntegrationTests().catch(console.error);