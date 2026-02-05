/**
 * FINAL DIAGNOSTIC SCRIPT
 * 
 * This script performs comprehensive testing to determine the exact status
 * of your notification system and provides precise solutions.
 * 
 * Run with: node final-diagnostic.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  domain: 'http://10.251.82.135:8080',
  testClientId: 'test-client-id', // Replace with actual client ID
  timeout: 10000
};

console.log('🔍 FINAL NOTIFICATION SYSTEM DIAGNOSTIC');
console.log('=' .repeat(60));
console.log('🌐 Backend URL:', CONFIG.domain);
console.log('🏢 Test Client ID:', CONFIG.testClientId);
console.log('⏰ Started at:', new Date().toLocaleString());
console.log('=' .repeat(60) + '\n');

// Test Results Storage
const diagnosticResults = {
  connectivity: { status: 'unknown', details: null },
  materialActivity: { status: 'unknown', details: null },
  recipients: { status: 'unknown', details: null },
  send: { status: 'unknown', details: null },
  overall: { status: 'unknown', message: '', solution: '' }
};

// Test 1: Backend Connectivity
async function testConnectivity() {
  console.log('🌐 TEST 1: Backend Connectivity');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/materialActivity?limit=1`, {
      timeout: CONFIG.timeout
    });
    
    if (response.status === 200) {
      diagnosticResults.connectivity = {
        status: 'pass',
        details: { responseTime: 'Connected', status: response.status }
      };
      console.log('✅ PASS: Backend server is accessible');
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   🔗 URL: ${CONFIG.domain}`);
    } else {
      diagnosticResults.connectivity = {
        status: 'warning',
        details: { status: response.status }
      };
      console.log(`⚠️  WARNING: Unexpected status ${response.status}`);
    }
  } catch (error) {
    diagnosticResults.connectivity = {
      status: 'fail',
      details: { error: error.message, code: error.code }
    };
    console.log('❌ FAIL: Cannot connect to backend');
    console.log(`   🚨 Error: ${error.message}`);
    console.log(`   💡 Check: Is backend server running at ${CONFIG.domain}?`);
  }
  
  console.log('');
}

// Test 2: Material Activity API
async function testMaterialActivityAPI() {
  console.log('📦 TEST 2: Material Activity API');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/materialActivity?clientId=${CONFIG.testClientId}&limit=1`);
    
    if (response.data.success) {
      diagnosticResults.materialActivity = {
        status: 'pass',
        details: { activitiesFound: response.data.data?.length || 0 }
      };
      console.log('✅ PASS: Material Activity API working');
      console.log(`   📊 Activities found: ${response.data.data?.length || 0}`);
    } else {
      diagnosticResults.materialActivity = {
        status: 'warning',
        details: { message: response.data.message }
      };
      console.log('⚠️  WARNING: API returned success: false');
      console.log(`   📋 Message: ${response.data.message}`);
    }
  } catch (error) {
    diagnosticResults.materialActivity = {
      status: 'fail',
      details: { error: error.response?.status || error.message }
    };
    console.log('❌ FAIL: Material Activity API failed');
    console.log(`   🚨 Error: ${error.response?.status || error.message}`);
  }
  
  console.log('');
}

// Test 3: Notification Recipients API (Critical)
async function testRecipientsAPI() {
  console.log('👥 TEST 3: Notification Recipients API (CRITICAL)');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${CONFIG.domain}/api/notifications/recipients?clientId=${CONFIG.testClientId}`);
    
    if (response.data.success) {
      const recipients = response.data.recipients || [];
      const adminCount = recipients.filter(r => r.userType === 'admin').length;
      const staffCount = recipients.filter(r => r.userType === 'staff').length;
      
      diagnosticResults.recipients = {
        status: 'pass',
        details: {
          totalRecipients: recipients.length,
          adminCount,
          staffCount,
          recipients: recipients.map(r => ({ fullName: r.fullName, userType: r.userType }))
        }
      };
      
      console.log('✅ PASS: Recipients API working');
      console.log(`   👥 Total recipients: ${recipients.length}`);
      console.log(`   👔 Admins: ${adminCount}`);
      console.log(`   👷 Staff: ${staffCount}`);
      
      if (recipients.length > 0) {
        console.log('   📋 Recipients:');
        recipients.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.fullName} (${r.userType})`);
        });
      } else {
        console.log('   ⚠️  No recipients found - create users for this client');
      }
    } else {
      diagnosticResults.recipients = {
        status: 'warning',
        details: { message: response.data.message }
      };
      console.log('⚠️  WARNING: API returned success: false');
      console.log(`   📋 Message: ${response.data.message}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      diagnosticResults.recipients = {
        status: 'fail',
        details: { error: 'API not implemented (404)' }
      };
      console.log('❌ CRITICAL FAIL: Recipients API not implemented (404)');
      console.log('   🚨 This API is REQUIRED for multi-user notifications');
      console.log('   💡 Solution: Implement GET /api/notifications/recipients');
    } else {
      diagnosticResults.recipients = {
        status: 'fail',
        details: { error: error.response?.status || error.message }
      };
      console.log('❌ FAIL: Recipients API error');
      console.log(`   🚨 Error: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('');
}

// Test 4: Notification Send API (Critical)
async function testSendAPI() {
  console.log('📤 TEST 4: Notification Send API (CRITICAL)');
  console.log('-'.repeat(40));
  
  const testPayload = {
    title: '🧪 Diagnostic Test',
    body: 'Testing notification send API functionality',
    category: 'material',
    action: 'test',
    data: {
      clientId: CONFIG.testClientId,
      projectId: 'diagnostic-test',
      triggeredBy: {
        userId: 'diagnostic-user',
        fullName: 'Diagnostic Test User',
        userType: 'staff'
      }
    },
    recipients: [], // Empty for testing
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${CONFIG.domain}/api/notifications/send`, testPayload);
    
    if (response.data.success) {
      diagnosticResults.send = {
        status: 'pass',
        details: { notificationsSent: response.data.data?.notificationsSent || 0 }
      };
      console.log('✅ PASS: Send API working');
      console.log(`   📤 Notifications sent: ${response.data.data?.notificationsSent || 0}`);
    } else {
      diagnosticResults.send = {
        status: 'warning',
        details: { message: response.data.message }
      };
      console.log('⚠️  WARNING: API returned success: false');
      console.log(`   📋 Message: ${response.data.message}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      diagnosticResults.send = {
        status: 'fail',
        details: { error: 'API not implemented (404)' }
      };
      console.log('❌ CRITICAL FAIL: Send API not implemented (404)');
      console.log('   🚨 This API is REQUIRED for multi-user notifications');
      console.log('   💡 Solution: Implement POST /api/notifications/send');
    } else if (error.response?.status === 400) {
      diagnosticResults.send = {
        status: 'pass',
        details: { message: 'API exists (validation error expected)' }
      };
      console.log('✅ PASS: Send API exists (400 error expected with empty recipients)');
    } else {
      diagnosticResults.send = {
        status: 'fail',
        details: { error: error.response?.status || error.message }
      };
      console.log('❌ FAIL: Send API error');
      console.log(`   🚨 Error: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('');
}

// Generate Final Diagnosis
function generateFinalDiagnosis() {
  console.log('🎯 FINAL DIAGNOSIS');
  console.log('=' .repeat(60));
  
  // Count results
  const results = Object.values(diagnosticResults).slice(0, 4); // Exclude 'overall'
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  console.log('📊 TEST SUMMARY:');
  console.log(`   ✅ Passed: ${passCount}/4`);
  console.log(`   ❌ Failed: ${failCount}/4`);
  console.log(`   ⚠️  Warnings: ${warningCount}/4`);
  console.log('');
  
  // Detailed results
  console.log('📋 DETAILED RESULTS:');
  console.log(`   🌐 Backend Connectivity: ${getStatusEmoji(diagnosticResults.connectivity.status)}`);
  console.log(`   📦 Material Activity API: ${getStatusEmoji(diagnosticResults.materialActivity.status)}`);
  console.log(`   👥 Recipients API: ${getStatusEmoji(diagnosticResults.recipients.status)} ${diagnosticResults.recipients.status === 'fail' ? '(CRITICAL)' : ''}`);
  console.log(`   📤 Send API: ${getStatusEmoji(diagnosticResults.send.status)} ${diagnosticResults.send.status === 'fail' ? '(CRITICAL)' : ''}`);
  console.log('');
  
  // Overall diagnosis
  let overallStatus, message, solution;
  
  if (diagnosticResults.connectivity.status === 'fail') {
    overallStatus = 'BROKEN';
    message = 'Cannot connect to backend server';
    solution = 'Fix backend connectivity first, then re-run diagnostic';
  } else if (diagnosticResults.recipients.status === 'fail' && diagnosticResults.send.status === 'fail') {
    overallStatus = 'BROKEN';
    message = 'Both critical notification APIs are missing';
    solution = 'Implement both notification APIs using BACKEND_NOTIFICATION_ROUTES.js';
  } else if (diagnosticResults.recipients.status === 'fail' || diagnosticResults.send.status === 'fail') {
    overallStatus = 'PARTIALLY BROKEN';
    message = 'One critical notification API is missing';
    solution = 'Implement missing notification API using BACKEND_NOTIFICATION_ROUTES.js';
  } else if (failCount > 0 || warningCount > 0) {
    overallStatus = 'PARTIALLY WORKING';
    message = 'System has some issues but core functionality may work';
    solution = 'Address warnings and failed tests for optimal performance';
  } else {
    overallStatus = 'FULLY WORKING';
    message = 'All systems operational - multi-user notifications should work';
    solution = 'Test with multiple user accounts to verify cross-user notifications';
  }
  
  diagnosticResults.overall = { status: overallStatus.toLowerCase(), message, solution };
  
  console.log('🎯 OVERALL STATUS:');
  console.log(`   ${getOverallStatusEmoji(overallStatus)} ${overallStatus}`);
  console.log(`   📝 ${message}`);
  console.log('');
  
  console.log('💡 RECOMMENDED SOLUTION:');
  console.log(`   ${solution}`);
  console.log('');
  
  // Implementation guidance
  if (overallStatus.includes('BROKEN')) {
    console.log('🔧 IMMEDIATE ACTIONS REQUIRED:');
    if (diagnosticResults.connectivity.status === 'fail') {
      console.log('   1. Start/restart your backend server');
      console.log('   2. Verify server is running on http://10.251.82.135:8080');
      console.log('   3. Check network connectivity');
    }
    if (diagnosticResults.recipients.status === 'fail') {
      console.log('   1. Add GET /api/notifications/recipients endpoint');
    }
    if (diagnosticResults.send.status === 'fail') {
      console.log('   2. Add POST /api/notifications/send endpoint');
    }
    console.log('   3. Use BACKEND_NOTIFICATION_ROUTES.js for complete code');
    console.log('   4. Restart backend server after implementation');
    console.log('   5. Re-run this diagnostic to verify fixes');
  } else if (overallStatus === 'FULLY WORKING') {
    console.log('🎉 SYSTEM READY:');
    console.log('   1. Multi-user notifications should work');
    console.log('   2. Test with multiple user accounts');
    console.log('   3. Verify cross-user notification delivery');
    console.log('   4. Check notification content and formatting');
  }
  
  console.log('');
  console.log('📁 IMPLEMENTATION FILES:');
  console.log('   - BACKEND_NOTIFICATION_ROUTES.js (Complete backend code)');
  console.log('   - STEP_BY_STEP_FIX.md (Implementation guide)');
  console.log('   - COMPREHENSIVE_NOTIFICATION_TEST.tsx (React testing)');
  console.log('   - test-after-fix.js (Post-implementation verification)');
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Diagnostic completed at:', new Date().toLocaleString());
  console.log('=' .repeat(60));
}

// Helper functions
function getStatusEmoji(status) {
  switch (status) {
    case 'pass': return '✅ PASS';
    case 'fail': return '❌ FAIL';
    case 'warning': return '⚠️  WARNING';
    default: return '❓ UNKNOWN';
  }
}

function getOverallStatusEmoji(status) {
  if (status.includes('WORKING')) return '🎉';
  if (status.includes('BROKEN')) return '🚨';
  if (status.includes('PARTIAL')) return '⚠️';
  return '❓';
}

// Main diagnostic runner
async function runFinalDiagnostic() {
  try {
    await testConnectivity();
    
    // Only continue if backend is accessible
    if (diagnosticResults.connectivity.status !== 'fail') {
      await testMaterialActivityAPI();
      await testRecipientsAPI();
      await testSendAPI();
    }
    
    generateFinalDiagnosis();
    
  } catch (error) {
    console.error('🚨 DIAGNOSTIC ERROR:', error.message);
    console.log('\n💡 Try running the diagnostic again or check your network connection.');
  }
}

// Run diagnostic
runFinalDiagnostic();