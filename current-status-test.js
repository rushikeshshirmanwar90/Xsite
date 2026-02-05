/**
 * CURRENT STATUS TEST - Notification System
 * 
 * This script tests the current status of your notification system
 * to see if the backend APIs have been implemented.
 * 
 * Run with: node current-status-test.js
 */

const axios = require('axios');

const CONFIG = {
  domain: 'http://10.251.82.135:8080',
  testClientId: 'test-client-id', // Replace with your actual client ID
  timeout: 10000
};

console.log('🔍 CURRENT NOTIFICATION SYSTEM STATUS TEST');
console.log('=' .repeat(60));
console.log('🌐 Backend URL:', CONFIG.domain);
console.log('🏢 Test Client ID:', CONFIG.testClientId);
console.log('⏰ Test Time:', new Date().toLocaleString());
console.log('=' .repeat(60) + '\n');

// Test Results Storage
const testResults = {
  connectivity: { status: 'unknown', message: '', details: null },
  materialActivity: { status: 'unknown', message: '', details: null },
  recipients: { status: 'unknown', message: '', details: null },
  send: { status: 'unknown', message: '', details: null },
  overall: { status: 'unknown', message: '', recommendation: '' }
};

// Test 1: Backend Connectivity
async function testBackendConnectivity() {
  console.log('🌐 TEST 1: Backend Server Connectivity');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.domain}/api/materialActivity?limit=1`, {
      timeout: CONFIG.timeout
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      testResults.connectivity = {
        status: 'pass',
        message: `Backend server is accessible (${responseTime}ms)`,
        details: { responseTime, status: response.status }
      };
      console.log('✅ PASS: Backend server is accessible');
      console.log(`   📊 Response time: ${responseTime}ms`);
      console.log(`   🔗 Status: ${response.status}`);
    } else {
      testResults.connectivity = {
        status: 'warning',
        message: `Unexpected response status: ${response.status}`,
        details: { status: response.status }
      };
      console.log(`⚠️  WARNING: Unexpected status ${response.status}`);
    }
  } catch (error) {
    testResults.connectivity = {
      status: 'fail',
      message: `Cannot connect to backend: ${error.message}`,
      details: { error: error.message, code: error.code }
    };
    console.log('❌ FAIL: Cannot connect to backend server');
    console.log(`   🚨 Error: ${error.message}`);
    console.log(`   💡 Check: Is backend running at ${CONFIG.domain}?`);
  }
  
  console.log('');
}

// Test 2: Material Activity API (Should work)
async function testMaterialActivityAPI() {
  console.log('📦 TEST 2: Material Activity API (Existing)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/materialActivity?clientId=${CONFIG.testClientId}&limit=1`);
    
    if (response.data.success) {
      const activitiesCount = response.data.data?.length || 0;
      testResults.materialActivity = {
        status: 'pass',
        message: `Material Activity API working (${activitiesCount} activities found)`,
        details: { activitiesFound: activitiesCount }
      };
      console.log('✅ PASS: Material Activity API is working');
      console.log(`   📊 Activities found: ${activitiesCount}`);
    } else {
      testResults.materialActivity = {
        status: 'warning',
        message: `API returned success: false - ${response.data.message || 'Unknown error'}`,
        details: { response: response.data }
      };
      console.log('⚠️  WARNING: API returned success: false');
      console.log(`   📋 Message: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    testResults.materialActivity = {
      status: 'fail',
      message: `Material Activity API failed: ${error.response?.status || error.message}`,
      details: { error: error.response?.status || error.message }
    };
    console.log('❌ FAIL: Material Activity API failed');
    console.log(`   🚨 Error: ${error.response?.status || error.message}`);
  }
  
  console.log('');
}

// Test 3: Notification Recipients API (Critical - May be missing)
async function testNotificationRecipientsAPI() {
  console.log('👥 TEST 3: Notification Recipients API (CRITICAL)');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/notifications/recipients?clientId=${CONFIG.testClientId}`);
    
    if (response.data.success) {
      const recipients = response.data.recipients || [];
      const adminCount = recipients.filter(r => r.userType === 'admin').length;
      const staffCount = recipients.filter(r => r.userType === 'staff').length;
      
      testResults.recipients = {
        status: 'pass',
        message: `Recipients API working! Found ${recipients.length} users (${adminCount} admins, ${staffCount} staff)`,
        details: {
          totalRecipients: recipients.length,
          adminCount,
          staffCount,
          recipients: recipients.map(r => ({ fullName: r.fullName, userType: r.userType }))
        }
      };
      
      console.log('✅ PASS: Recipients API is working!');
      console.log(`   👥 Total recipients: ${recipients.length}`);
      console.log(`   👔 Admins: ${adminCount}`);
      console.log(`   👷 Staff: ${staffCount}`);
      
      if (recipients.length > 0) {
        console.log('   📋 Recipients found:');
        recipients.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.fullName} (${r.userType})`);
        });
      } else {
        console.log('   ⚠️  No recipients found - create users for this client');
      }
    } else {
      testResults.recipients = {
        status: 'warning',
        message: `Recipients API exists but returned success: false - ${response.data.message || 'Unknown error'}`,
        details: { response: response.data }
      };
      console.log('⚠️  WARNING: API exists but returned success: false');
      console.log(`   📋 Message: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      testResults.recipients = {
        status: 'fail',
        message: 'Recipients API not implemented (404) - CRITICAL ISSUE',
        details: { error: 'API not found (404)' }
      };
      console.log('❌ CRITICAL FAIL: Recipients API not implemented (404)');
      console.log('   🚨 This API is REQUIRED for multi-user notifications');
      console.log('   💡 Solution: Implement GET /api/notifications/recipients');
    } else {
      testResults.recipients = {
        status: 'fail',
        message: `Recipients API error: ${error.response?.status || error.message}`,
        details: { error: error.response?.status || error.message }
      };
      console.log('❌ FAIL: Recipients API error');
      console.log(`   🚨 Error: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('');
}

// Test 4: Notification Send API (Critical - May be missing)
async function testNotificationSendAPI() {
  console.log('📤 TEST 4: Notification Send API (CRITICAL)');
  console.log('-'.repeat(50));
  
  const testPayload = {
    title: '🧪 Status Test Notification',
    body: 'Testing notification send API to verify current implementation status',
    category: 'material',
    action: 'test',
    data: {
      clientId: CONFIG.testClientId,
      projectId: 'status-test-' + Date.now(),
      triggeredBy: {
        userId: 'status-test-user',
        fullName: 'Status Test User',
        userType: 'staff'
      }
    },
    recipients: [], // Empty for testing
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${CONFIG.domain}/api/notifications/send`, testPayload);
    
    if (response.data.success) {
      testResults.send = {
        status: 'pass',
        message: `Send API working! Processed ${response.data.data?.notificationsSent || 0} notifications`,
        details: { 
          notificationsSent: response.data.data?.notificationsSent || 0,
          response: response.data 
        }
      };
      console.log('✅ PASS: Send API is working!');
      console.log(`   📤 Notifications processed: ${response.data.data?.notificationsSent || 0}`);
    } else {
      testResults.send = {
        status: 'warning',
        message: `Send API exists but returned success: false - ${response.data.message || 'Unknown error'}`,
        details: { response: response.data }
      };
      console.log('⚠️  WARNING: API exists but returned success: false');
      console.log(`   📋 Message: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      testResults.send = {
        status: 'fail',
        message: 'Send API not implemented (404) - CRITICAL ISSUE',
        details: { error: 'API not found (404)' }
      };
      console.log('❌ CRITICAL FAIL: Send API not implemented (404)');
      console.log('   🚨 This API is REQUIRED for multi-user notifications');
      console.log('   💡 Solution: Implement POST /api/notifications/send');
    } else if (error.response?.status === 400) {
      testResults.send = {
        status: 'pass',
        message: 'Send API exists and working (400 error expected with empty recipients)',
        details: { message: 'Validation error expected with empty recipients' }
      };
      console.log('✅ PASS: Send API exists and working');
      console.log('   📋 Note: 400 error expected with empty recipients array');
    } else {
      testResults.send = {
        status: 'fail',
        message: `Send API error: ${error.response?.status || error.message}`,
        details: { error: error.response?.status || error.message }
      };
      console.log('❌ FAIL: Send API error');
      console.log(`   🚨 Error: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('');
}

// Generate Overall Status Report
function generateOverallStatus() {
  console.log('🎯 OVERALL SYSTEM STATUS ANALYSIS');
  console.log('=' .repeat(60));
  
  // Count results
  const passCount = Object.values(testResults).slice(0, 4).filter(r => r.status === 'pass').length;
  const failCount = Object.values(testResults).slice(0, 4).filter(r => r.status === 'fail').length;
  const warningCount = Object.values(testResults).slice(0, 4).filter(r => r.status === 'warning').length;
  
  console.log('📊 TEST SUMMARY:');
  console.log(`   ✅ Passed: ${passCount}/4`);
  console.log(`   ❌ Failed: ${failCount}/4`);
  console.log(`   ⚠️  Warnings: ${warningCount}/4`);
  console.log('');
  
  console.log('📋 DETAILED RESULTS:');
  console.log(`   🌐 Backend Connectivity: ${getStatusDisplay(testResults.connectivity.status)}`);
  console.log(`   📦 Material Activity API: ${getStatusDisplay(testResults.materialActivity.status)}`);
  console.log(`   👥 Recipients API: ${getStatusDisplay(testResults.recipients.status)} ${testResults.recipients.status === 'fail' ? '(CRITICAL)' : ''}`);
  console.log(`   📤 Send API: ${getStatusDisplay(testResults.send.status)} ${testResults.send.status === 'fail' ? '(CRITICAL)' : ''}`);
  console.log('');
  
  // Determine overall status
  let overallStatus, message, recommendation;
  
  if (testResults.connectivity.status === 'fail') {
    overallStatus = 'SYSTEM DOWN';
    message = 'Backend server is not accessible';
    recommendation = 'Start/restart backend server and check network connectivity';
  } else if (testResults.recipients.status === 'fail' && testResults.send.status === 'fail') {
    overallStatus = 'MULTI-USER NOTIFICATIONS BROKEN';
    message = 'Both critical notification APIs are missing (404 errors)';
    recommendation = 'Implement both notification APIs using IMMEDIATE_BACKEND_FIX.js';
  } else if (testResults.recipients.status === 'fail' || testResults.send.status === 'fail') {
    overallStatus = 'PARTIALLY IMPLEMENTED';
    message = 'One critical notification API is missing';
    recommendation = 'Complete the notification API implementation';
  } else if (passCount === 4) {
    overallStatus = 'FULLY WORKING';
    message = 'All systems operational - multi-user notifications should work perfectly';
    recommendation = 'Test with multiple user accounts to verify cross-user notifications';
  } else {
    overallStatus = 'PARTIALLY WORKING';
    message = 'System has some issues but may have basic functionality';
    recommendation = 'Address warnings and failed tests for optimal performance';
  }
  
  testResults.overall = { status: overallStatus.toLowerCase(), message, recommendation };
  
  console.log('🎯 OVERALL STATUS:');
  console.log(`   ${getOverallStatusDisplay(overallStatus)} ${overallStatus}`);
  console.log(`   📝 ${message}`);
  console.log('');
  
  console.log('💡 RECOMMENDATION:');
  console.log(`   ${recommendation}`);
  console.log('');
  
  // Specific actions based on status
  if (overallStatus.includes('BROKEN') || overallStatus.includes('PARTIALLY IMPLEMENTED')) {
    console.log('🔧 IMMEDIATE ACTIONS REQUIRED:');
    if (testResults.connectivity.status === 'fail') {
      console.log('   1. Start/restart your backend server');
      console.log('   2. Verify server is accessible at http://10.251.82.135:8080');
    }
    if (testResults.recipients.status === 'fail') {
      console.log('   1. Add GET /api/notifications/recipients endpoint to your backend');
    }
    if (testResults.send.status === 'fail') {
      console.log('   2. Add POST /api/notifications/send endpoint to your backend');
    }
    console.log('   3. Use IMMEDIATE_BACKEND_FIX.js for ready-to-use code');
    console.log('   4. Restart backend server after adding endpoints');
    console.log('   5. Re-run this test to verify implementation');
  } else if (overallStatus === 'FULLY WORKING') {
    console.log('🎉 SYSTEM READY FOR PRODUCTION:');
    console.log('   1. Multi-user notifications are fully implemented');
    console.log('   2. Test with multiple user accounts (admin + staff)');
    console.log('   3. Verify staff material import → admin gets notification');
    console.log('   4. Verify admin activity → other admins get notification');
    console.log('   5. Check notification content and formatting');
  }
  
  console.log('');
  console.log('📁 AVAILABLE RESOURCES:');
  console.log('   - IMMEDIATE_BACKEND_FIX.js (Backend implementation code)');
  console.log('   - SIMPLE_IMPLEMENTATION_STEPS.md (Step-by-step guide)');
  console.log('   - verify-fix.js (Post-implementation verification)');
  console.log('   - COMPREHENSIVE_NOTIFICATION_TEST.tsx (React Native testing)');
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Status test completed at:', new Date().toLocaleString());
  console.log('=' .repeat(60));
}

// Helper functions
function getStatusDisplay(status) {
  switch (status) {
    case 'pass': return '✅ WORKING';
    case 'fail': return '❌ FAILED';
    case 'warning': return '⚠️  WARNING';
    default: return '❓ UNKNOWN';
  }
}

function getOverallStatusDisplay(status) {
  if (status.includes('WORKING')) return '🎉';
  if (status.includes('BROKEN')) return '🚨';
  if (status.includes('DOWN')) return '💀';
  if (status.includes('PARTIAL')) return '⚠️';
  return '❓';
}

// Main test runner
async function runCurrentStatusTest() {
  try {
    await testBackendConnectivity();
    
    // Only continue if backend is accessible
    if (testResults.connectivity.status !== 'fail') {
      await testMaterialActivityAPI();
      await testNotificationRecipientsAPI();
      await testNotificationSendAPI();
    }
    
    generateOverallStatus();
    
  } catch (error) {
    console.error('🚨 STATUS TEST ERROR:', error.message);
    console.log('\n💡 Try running the test again or check your network connection.');
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runCurrentStatusTest();
}

module.exports = {
  runCurrentStatusTest,
  testResults,
  CONFIG
};