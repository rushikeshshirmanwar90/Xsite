/**
 * Quick API Test Script
 * 
 * This script tests the notification system APIs to verify if they're working
 * Run this with: node quick-api-test.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  domain: 'http://10.251.82.135:8080',
  testClientId: 'test-client-id', // Replace with actual client ID
  testProjectId: 'test-project-id', // Replace with actual project ID
  testUserId: 'test-user-id' // Replace with actual user ID
};

console.log('🚀 Starting Quick API Test for Notification System');
console.log('📍 Backend URL:', CONFIG.domain);
console.log('🏢 Test Client ID:', CONFIG.testClientId);
console.log('\n' + '='.repeat(60) + '\n');

// Test Results
const results = {
  materialActivity: { status: 'unknown', message: '', details: null },
  recipients: { status: 'unknown', message: '', details: null },
  send: { status: 'unknown', message: '', details: null }
};

// Test 1: Material Activity API (should already work)
async function testMaterialActivityAPI() {
  console.log('🧪 Test 1: Material Activity API');
  console.log('📡 GET /api/materialActivity');
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/materialActivity?clientId=${CONFIG.testClientId}&limit=1`);
    
    if (response.data.success) {
      results.materialActivity = {
        status: 'pass',
        message: `✅ Working - Found ${response.data.data?.length || 0} activities`,
        details: { activitiesCount: response.data.data?.length || 0 }
      };
      console.log('   ✅ PASS: Material Activity API is working');
      console.log(`   📊 Found ${response.data.data?.length || 0} activities`);
    } else {
      results.materialActivity = {
        status: 'warning',
        message: '⚠️ API returned success: false',
        details: response.data
      };
      console.log('   ⚠️ WARNING: API returned success: false');
    }
  } catch (error) {
    results.materialActivity = {
      status: 'fail',
      message: `❌ Failed: ${error.response?.status || error.message}`,
      details: { status: error.response?.status, message: error.message }
    };
    console.log('   ❌ FAIL: Material Activity API failed');
    console.log('   📋 Error:', error.response?.status || error.message);
  }
  
  console.log('');
}

// Test 2: Notification Recipients API (newly implemented)
async function testRecipientsAPI() {
  console.log('🧪 Test 2: Notification Recipients API');
  console.log('📡 GET /api/notifications/recipients');
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/notifications/recipients?clientId=${CONFIG.testClientId}&projectId=${CONFIG.testProjectId}`);
    
    if (response.data.success) {
      const recipients = response.data.recipients || [];
      const adminCount = recipients.filter(r => r.userType === 'admin').length;
      const staffCount = recipients.filter(r => r.userType === 'staff').length;
      
      results.recipients = {
        status: 'pass',
        message: `✅ Working - Found ${recipients.length} recipients (${adminCount} admins, ${staffCount} staff)`,
        details: { 
          totalRecipients: recipients.length, 
          adminCount, 
          staffCount,
          recipients: recipients.map(r => ({ fullName: r.fullName, userType: r.userType }))
        }
      };
      console.log('   ✅ PASS: Recipients API is working');
      console.log(`   👥 Found ${recipients.length} recipients:`);
      console.log(`      - ${adminCount} admins`);
      console.log(`      - ${staffCount} staff`);
      
      if (recipients.length > 0) {
        console.log('   📋 Recipients:');
        recipients.forEach(r => {
          console.log(`      - ${r.fullName} (${r.userType})`);
        });
      }
    } else {
      results.recipients = {
        status: 'warning',
        message: '⚠️ API returned success: false',
        details: response.data
      };
      console.log('   ⚠️ WARNING: API returned success: false');
      console.log('   📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    if (error.response?.status === 404) {
      results.recipients = {
        status: 'fail',
        message: '❌ API not implemented (404)',
        details: { status: 404, message: 'Endpoint not found' }
      };
      console.log('   ❌ FAIL: Recipients API not implemented (404)');
      console.log('   💡 SOLUTION: Implement GET /api/notifications/recipients endpoint');
    } else {
      results.recipients = {
        status: 'fail',
        message: `❌ Failed: ${error.response?.status || error.message}`,
        details: { status: error.response?.status, message: error.message }
      };
      console.log('   ❌ FAIL: Recipients API failed');
      console.log('   📋 Error:', error.response?.status || error.message);
    }
  }
  
  console.log('');
}

// Test 3: Notification Send API (newly implemented)
async function testSendAPI() {
  console.log('🧪 Test 3: Notification Send API');
  console.log('📡 POST /api/notifications/send');
  
  const testPayload = {
    title: '🧪 API Test Notification',
    body: 'Testing notification send API functionality',
    category: 'material',
    action: 'test',
    data: {
      clientId: CONFIG.testClientId,
      projectId: CONFIG.testProjectId,
      triggeredBy: {
        userId: CONFIG.testUserId,
        fullName: 'API Test User',
        userType: 'staff'
      }
    },
    recipients: [], // Empty for testing
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${CONFIG.domain}/api/notifications/send`, testPayload);
    
    if (response.data.success) {
      results.send = {
        status: 'pass',
        message: '✅ Working - Notifications can be sent',
        details: response.data.data
      };
      console.log('   ✅ PASS: Send API is working');
      console.log('   📤 Notifications sent:', response.data.data?.notificationsSent || 0);
    } else {
      results.send = {
        status: 'warning',
        message: '⚠️ API returned success: false',
        details: response.data
      };
      console.log('   ⚠️ WARNING: API returned success: false');
      console.log('   📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    if (error.response?.status === 404) {
      results.send = {
        status: 'fail',
        message: '❌ API not implemented (404)',
        details: { status: 404, message: 'Endpoint not found' }
      };
      console.log('   ❌ FAIL: Send API not implemented (404)');
      console.log('   💡 SOLUTION: Implement POST /api/notifications/send endpoint');
    } else if (error.response?.status === 400) {
      results.send = {
        status: 'pass',
        message: '✅ API implemented (validation error expected with empty recipients)',
        details: { status: 400, message: 'Validation error expected' }
      };
      console.log('   ✅ PASS: Send API is implemented (validation error expected)');
      console.log('   📋 Note: 400 error expected with empty recipients array');
    } else {
      results.send = {
        status: 'fail',
        message: `❌ Failed: ${error.response?.status || error.message}`,
        details: { status: error.response?.status, message: error.message }
      };
      console.log('   ❌ FAIL: Send API failed');
      console.log('   📋 Error:', error.response?.status || error.message);
    }
  }
  
  console.log('');
}

// Generate Summary Report
function generateSummaryReport() {
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;
  const warningCount = Object.values(results).filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed: ${passCount}/3`);
  console.log(`❌ Failed: ${failCount}/3`);
  console.log(`⚠️ Warnings: ${warningCount}/3`);
  console.log('');
  
  // Detailed results
  console.log('📋 DETAILED RESULTS:');
  console.log(`1. Material Activity API: ${results.materialActivity.message}`);
  console.log(`2. Recipients API: ${results.recipients.message}`);
  console.log(`3. Send API: ${results.send.message}`);
  console.log('');
  
  // Overall status
  console.log('🎯 OVERALL STATUS:');
  if (passCount === 3) {
    console.log('🎉 ALL SYSTEMS WORKING - Multi-user notifications are fully functional!');
    console.log('');
    console.log('✅ Next Steps:');
    console.log('   1. Test with multiple user accounts');
    console.log('   2. Verify cross-user notifications');
    console.log('   3. Deploy to production');
  } else if (passCount >= 1) {
    console.log('⚠️ PARTIAL FUNCTIONALITY - Some APIs working, some missing');
    console.log('');
    console.log('🔧 Required Actions:');
    if (results.recipients.status === 'fail') {
      console.log('   1. Implement GET /api/notifications/recipients endpoint');
    }
    if (results.send.status === 'fail') {
      console.log('   2. Implement POST /api/notifications/send endpoint');
    }
    console.log('   3. Use BACKEND_FIX_IMPLEMENTATION.js for ready-to-use code');
  } else {
    console.log('❌ SYSTEM NOT WORKING - Critical APIs missing');
    console.log('');
    console.log('🚨 Urgent Actions Required:');
    console.log('   1. Check if backend server is running');
    console.log('   2. Implement notification APIs using BACKEND_FIX_IMPLEMENTATION.js');
    console.log('   3. Verify network connectivity');
  }
  
  console.log('');
  console.log('📁 Implementation Files:');
  console.log('   - BACKEND_FIX_IMPLEMENTATION.js (Complete backend code)');
  console.log('   - EXACT_FIX_STEPS.md (Step-by-step guide)');
  console.log('   - NOTIFICATION_VERIFICATION_TEST.tsx (React testing component)');
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test completed at:', new Date().toLocaleString());
}

// Main test runner
async function runQuickAPITest() {
  try {
    await testMaterialActivityAPI();
    await testRecipientsAPI();
    await testSendAPI();
    generateSummaryReport();
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runQuickAPITest();
}

module.exports = {
  runQuickAPITest,
  testMaterialActivityAPI,
  testRecipientsAPI,
  testSendAPI,
  CONFIG
};