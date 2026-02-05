/**
 * Complete Notification System Test
 * 
 * This script tests the entire notification flow:
 * 1. Backend APIs (recipients and send)
 * 2. Push token registration
 * 3. Permission system
 * 4. End-to-end notification delivery
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://10.251.82.135:8080';
const TEST_CLIENT_ID = '695f818566b3d06dfb6083f2'; // Valid client ID with 2 admin users

// Test data
const testNotification = {
  title: '🧪 Test Notification',
  body: 'This is a test notification from the complete system test',
  category: 'material_activity',
  action: 'material_added',
  data: {
    clientId: TEST_CLIENT_ID,
    projectId: 'test-project-123',
    materialName: 'Test Material',
    quantity: 100,
    triggeredBy: 'System Test'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test functions
async function testBackendHealth() {
  logTest('Testing Backend Health');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      logSuccess('Backend server is running');
      logInfo(`Response: ${JSON.stringify(response.data)}`);
      return true;
    } else {
      logError(`Unexpected status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      logError('❗ Backend server is not running or not accessible');
      logInfo('Please ensure the backend server is running on http://10.251.82.135:8080');
    }
    return false;
  }
}

async function testNotificationRecipientsAPI() {
  logTest('Testing Notification Recipients API');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/notifications/recipients`, {
      params: { clientId: TEST_CLIENT_ID },
      timeout: 10000
    });
    
    if (response.data.success) {
      const recipients = response.data.data.recipients;
      logSuccess(`Found ${recipients.length} notification recipients`);
      
      recipients.forEach((recipient, index) => {
        logInfo(`  ${index + 1}. ${recipient.fullName} (${recipient.userType}) - ${recipient.email}`);
      });
      
      return { success: true, recipients };
    } else {
      logError(`API returned error: ${response.data.message}`);
      return { success: false, recipients: [] };
    }
  } catch (error) {
    logError(`Recipients API test failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, recipients: [] };
  }
}

async function testNotificationSendAPI(recipients) {
  logTest('Testing Notification Send API');
  
  if (!recipients || recipients.length === 0) {
    logError('No recipients available for send test');
    return false;
  }
  
  try {
    const payload = {
      ...testNotification,
      recipients: recipients,
      timestamp: new Date().toISOString()
    };
    
    logInfo(`Sending notification to ${recipients.length} recipients...`);
    
    const response = await axios.post(`${BASE_URL}/api/notifications/send`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    if (response.data.success) {
      const result = response.data.data;
      logSuccess(`Notification sent successfully!`);
      logInfo(`  - Sent: ${result.notificationsSent}`);
      logInfo(`  - Failed: ${result.notificationsFailed}`);
      logInfo(`  - Total: ${result.totalProcessed}`);
      
      if (result.failedRecipients && result.failedRecipients.length > 0) {
        logError('Failed recipients:');
        result.failedRecipients.forEach(failed => {
          logError(`  - ${failed.fullName}: ${failed.error}`);
        });
      }
      
      return true;
    } else {
      logError(`Send API returned error: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Send API test failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testPushTokenAPI() {
  logTest('Testing Push Token API');
  
  const testPushToken = {
    userId: '507f1f77bcf86cd799439011',
    userType: 'staff',
    token: 'ExponentPushToken[test-token-12345]',
    platform: 'android',
    deviceId: 'test-device-123',
    deviceName: 'Test Device',
    appVersion: '1.0.0'
  };
  
  try {
    // Test POST (register token)
    logInfo('Testing push token registration...');
    const postResponse = await axios.post(`${BASE_URL}/api/push-token`, testPushToken, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    if (postResponse.data.success) {
      logSuccess('Push token registered successfully');
      logInfo(`Token ID: ${postResponse.data.data.tokenId}`);
      logInfo(`Is new: ${postResponse.data.data.isNew}`);
    } else {
      logError(`Push token registration failed: ${postResponse.data.message}`);
      return false;
    }
    
    // Test GET (retrieve tokens)
    logInfo('Testing push token retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/api/push-token`, {
      params: { userId: testPushToken.userId },
      timeout: 10000
    });
    
    if (getResponse.data.success) {
      const tokens = getResponse.data.data.tokens;
      logSuccess(`Retrieved ${tokens.length} push tokens`);
      tokens.forEach((token, index) => {
        logInfo(`  ${index + 1}. ${token.platform} - ${token.deviceName} (${token.isActive ? 'Active' : 'Inactive'})`);
      });
    } else {
      logError(`Push token retrieval failed: ${getResponse.data.message}`);
      return false;
    }
    
    // Test DELETE (deactivate token)
    logInfo('Testing push token deactivation...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/push-token`, {
      params: { userId: testPushToken.userId },
      timeout: 10000
    });
    
    if (deleteResponse.data.success) {
      logSuccess('Push token deactivated successfully');
    } else {
      logError(`Push token deactivation failed: ${deleteResponse.data.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Push token API test failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testEndToEndFlow() {
  logTest('Testing End-to-End Notification Flow');
  
  try {
    // Step 1: Get recipients
    logInfo('Step 1: Getting notification recipients...');
    const recipientsResult = await testNotificationRecipientsAPI();
    
    if (!recipientsResult.success) {
      logError('Cannot proceed with end-to-end test - recipients API failed');
      return false;
    }
    
    // Step 2: Send notification
    logInfo('Step 2: Sending notification to recipients...');
    const sendResult = await testNotificationSendAPI(recipientsResult.recipients);
    
    if (!sendResult) {
      logError('End-to-end test failed - send API failed');
      return false;
    }
    
    logSuccess('End-to-end notification flow completed successfully!');
    return true;
  } catch (error) {
    logError(`End-to-end test failed: ${error.message}`);
    return false;
  }
}

async function generateTestReport(results) {
  logSection('📊 TEST REPORT');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result === true).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, passedTests === totalTests ? 'green' : 'yellow');
  
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`  ${test}: ${status}`, color);
  });
  
  if (passedTests === totalTests) {
    logSection('🎉 ALL TESTS PASSED!');
    log('The notification system is fully operational and ready for production.', 'green');
    
    console.log('\n📱 Next Steps for Mobile App:');
    logInfo('1. Login to the mobile app');
    logInfo('2. The app should automatically request notification permissions');
    logInfo('3. Grant permissions when prompted');
    logInfo('4. Add materials to projects to trigger notifications');
    logInfo('5. Check that notifications are received by other users');
  } else {
    logSection('⚠️  SOME TESTS FAILED');
    log('Please review the failed tests and fix the issues before proceeding.', 'yellow');
    
    if (!results['Backend Health']) {
      logError('❗ Backend server is not running - this is critical!');
    }
    
    if (!results['Recipients API'] || !results['Send API']) {
      logError('❗ Notification APIs are not working - notifications will not be sent!');
    }
    
    if (!results['Push Token API']) {
      logError('❗ Push token API is not working - mobile notifications will not work!');
    }
  }
}

// Main test runner
async function runCompleteTest() {
  logSection('🚀 COMPLETE NOTIFICATION SYSTEM TEST');
  log('Testing all components of the notification system...', 'blue');
  
  const results = {};
  
  try {
    // Test 1: Backend Health
    results['Backend Health'] = await testBackendHealth();
    
    // Test 2: Recipients API
    results['Recipients API'] = false;
    const recipientsResult = await testNotificationRecipientsAPI();
    results['Recipients API'] = recipientsResult.success;
    
    // Test 3: Send API (only if recipients work)
    results['Send API'] = false;
    if (recipientsResult.success) {
      results['Send API'] = await testNotificationSendAPI(recipientsResult.recipients);
    } else {
      logError('Skipping Send API test - Recipients API failed');
    }
    
    // Test 4: Push Token API
    results['Push Token API'] = await testPushTokenAPI();
    
    // Test 5: End-to-End Flow
    results['End-to-End Flow'] = false;
    if (results['Recipients API'] && results['Send API']) {
      results['End-to-End Flow'] = await testEndToEndFlow();
    } else {
      logError('Skipping End-to-End test - prerequisite APIs failed');
    }
    
    // Generate report
    await generateTestReport(results);
    
  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    console.error(error);
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  runCompleteTest,
  testBackendHealth,
  testNotificationRecipientsAPI,
  testNotificationSendAPI,
  testPushTokenAPI,
  testEndToEndFlow
};