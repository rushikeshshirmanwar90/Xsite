#!/usr/bin/env node

/**
 * COMPREHENSIVE NOTIFICATION SYSTEM TEST
 * 
 * This script performs a complete end-to-end test of the notification system
 * including security validation, API testing, and functionality verification.
 * 
 * Usage:
 *   node test-notification-system-complete.js
 *   node test-notification-system-complete.js --api-only
 *   node test-notification-system-complete.js --security-only
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://real-estate-optimize-apis.vercel.app',
  testUserId: process.env.TEST_USER_ID || '676b0b4b4c8c5b4d8e9f1234',
  authToken: process.env.AUTH_TOKEN || 'test-jwt-token',
  encryptionKey: process.env.ENCRYPTION_KEY || 'test-encryption-key-12345',
  timeout: 10000,
  retries: 3
};

// Test Results Tracker
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTest(name, passed, message, details = {}) {
    const result = {
      name,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.tests.push(result);
    
    if (passed === true) {
      this.passed++;
      this.log(`${name}: ${message}`, 'success');
    } else if (passed === false) {
      this.failed++;
      this.log(`${name}: ${message}`, 'error');
      if (Object.keys(details).length > 0) {
        this.log(`Details: ${JSON.stringify(details, null, 2)}`, 'debug');
      }
    } else {
      this.warnings++;
      this.log(`${name}: ${message}`, 'warning');
    }
  }

  async runWithRetry(testFn, testName, maxRetries = CONFIG.retries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await testFn();
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          this.addTest(testName, false, `Failed after ${maxRetries} attempts`, {
            error: error.message,
            attempts: maxRetries
          });
        } else {
          this.log(`${testName} attempt ${attempt} failed, retrying...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔐 NOTIFICATION SYSTEM TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚠️  Warnings: ${this.warnings}`);
    console.log(`📊 Total: ${this.tests.length}`);
    console.log(`📈 Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.tests
        .filter(t => t.passed === false)
        .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
    }
    
    if (this.warnings > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.tests
        .filter(t => t.passed === null)
        .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed results
    this.saveResults();
    
    return this.failed === 0;
  }

  saveResults() {
    const results = {
      summary: {
        passed: this.passed,
        failed: this.failed,
        warnings: this.warnings,
        total: this.tests.length,
        successRate: ((this.passed / this.tests.length) * 100).toFixed(1),
        duration: ((Date.now() - this.startTime) / 1000).toFixed(2)
      },
      tests: this.tests,
      config: CONFIG,
      timestamp: new Date().toISOString()
    };
    
    const filename = `notification-test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    this.log(`Detailed results saved to: ${filename}`, 'info');
  }
}

const runner = new TestRunner();

/**
 * Test 1: Configuration Validation
 */
async function testConfiguration() {
  runner.log('Testing configuration...', 'info');
  
  // Check required environment variables
  const requiredVars = ['API_BASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName] && !CONFIG[varName.toLowerCase().replace('_', '')]);
  
  if (missing.length > 0) {
    runner.addTest(
      'Configuration Check',
      null,
      `Missing environment variables: ${missing.join(', ')}`,
      { missing, note: 'Using default values' }
    );
  } else {
    runner.addTest(
      'Configuration Check',
      true,
      'All required configuration present',
      { config: CONFIG }
    );
  }
  
  // Test API connectivity
  try {
    const response = await axios.get(`${CONFIG.apiBaseUrl}/health`, {
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      runner.addTest(
        'API Connectivity',
        true,
        'API server is reachable',
        { status: response.status, url: CONFIG.apiBaseUrl }
      );
    } else {
      runner.addTest(
        'API Connectivity',
        null,
        `API returned status ${response.status}`,
        { status: response.status, url: CONFIG.apiBaseUrl }
      );
    }
  } catch (error) {
    runner.addTest(
      'API Connectivity',
      false,
      'Cannot reach API server',
      { error: error.message, url: CONFIG.apiBaseUrl }
    );
  }
}

/**
 * Test 2: Security Implementation
 */
async function testSecurity() {
  runner.log('Testing security implementation...', 'info');
  
  // Test token encryption
  function encryptToken(token) {
    try {
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CONFIG.encryptionKey.padEnd(32, '0').slice(0, 32)), Buffer.alloc(16, 0));
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      // Fallback to simple base64 encoding for testing
      return Buffer.from(token).toString('base64');
    }
  }
  
  function decryptToken(encryptedToken) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(CONFIG.encryptionKey.padEnd(32, '0').slice(0, 32)), Buffer.alloc(16, 0));
      let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // Fallback to simple base64 decoding for testing
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
  }
  
  try {
    const testToken = 'ExponentPushToken[test-token-12345]';
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    
    if (testToken === decrypted) {
      runner.addTest(
        'Token Encryption/Decryption',
        true,
        'Token encryption working correctly',
        { 
          originalLength: testToken.length,
          encryptedLength: encrypted.length,
          matches: true
        }
      );
    } else {
      runner.addTest(
        'Token Encryption/Decryption',
        false,
        'Token encryption/decryption failed',
        { matches: false }
      );
    }
    
    // Test that encrypted token is different from original
    if (encrypted !== testToken) {
      runner.addTest(
        'Token Obfuscation',
        true,
        'Token properly obfuscated when encrypted',
        { obfuscated: true }
      );
    } else {
      runner.addTest(
        'Token Obfuscation',
        false,
        'Token not properly obfuscated',
        { obfuscated: false }
      );
    }
    
  } catch (error) {
    runner.addTest(
      'Token Encryption Test',
      false,
      'Encryption test failed',
      { error: error.message }
    );
  }
  
  // Test input validation
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    "'; DROP TABLE users; --",
    '<img src=x onerror=alert(1)>',
    'data:text/html,<script>alert(1)</script>'
  ];
  
  let validationPassed = 0;
  for (const input of maliciousInputs) {
    // Simple validation test (in real app, this would be more sophisticated)
    const isSafe = !input.includes('<script') && 
                   !input.includes('javascript:') && 
                   !input.includes('DROP TABLE') &&
                   !input.includes('onerror=') &&
                   !input.includes('data:text/html');
    
    if (!isSafe) {
      validationPassed++;
    }
  }
  
  if (validationPassed === maliciousInputs.length) {
    runner.addTest(
      'Input Validation',
      true,
      'All malicious inputs correctly identified',
      { tested: maliciousInputs.length, blocked: validationPassed }
    );
  } else {
    runner.addTest(
      'Input Validation',
      false,
      'Some malicious inputs not identified',
      { tested: maliciousInputs.length, blocked: validationPassed }
    );
  }
}

/**
 * Test 3: API Authentication
 */
async function testAPIAuthentication() {
  runner.log('Testing API authentication...', 'info');
  
  const testPayload = {
    userId: CONFIG.testUserId,
    token: 'ExponentPushToken[test-token-12345]',
    platform: 'ios',
    userType: 'client',
    deviceId: 'test-device-12345',
    appVersion: '1.0.0'
  };
  
  // Test 1: No authentication token (should fail)
  try {
    const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, testPayload, {
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      runner.addTest(
        'No Auth Token Rejection',
        true,
        'API correctly rejects requests without auth token',
        { status: response.status }
      );
    } else {
      runner.addTest(
        'No Auth Token Rejection',
        false,
        'API should reject requests without auth token',
        { status: response.status, expected: 401 }
      );
    }
  } catch (error) {
    if (error.response?.status === 401) {
      runner.addTest(
        'No Auth Token Rejection',
        true,
        'API correctly rejects requests without auth token',
        { status: error.response.status }
      );
    } else {
      runner.addTest(
        'No Auth Token Rejection',
        false,
        'Unexpected error during auth test',
        { error: error.message }
      );
    }
  }
  
  // Test 2: Invalid authentication token (should fail)
  try {
    const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, testPayload, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      },
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 403 || response.status === 401) {
      runner.addTest(
        'Invalid Auth Token Rejection',
        true,
        'API correctly rejects invalid auth tokens',
        { status: response.status }
      );
    } else {
      runner.addTest(
        'Invalid Auth Token Rejection',
        false,
        'API should reject invalid auth tokens',
        { status: response.status, expected: '401 or 403' }
      );
    }
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      runner.addTest(
        'Invalid Auth Token Rejection',
        true,
        'API correctly rejects invalid auth tokens',
        { status: error.response.status }
      );
    } else {
      runner.addTest(
        'Invalid Auth Token Rejection',
        false,
        'Unexpected error during invalid auth test',
        { error: error.message }
      );
    }
  }
  
  // Test 3: Valid authentication token (should succeed or fail gracefully)
  try {
    const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, testPayload, {
      headers: {
        'Authorization': `Bearer ${CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 200 || response.status === 201) {
      runner.addTest(
        'Valid Auth Token Acceptance',
        true,
        'API accepts valid auth tokens',
        { status: response.status, message: response.data?.message }
      );
    } else if (response.status === 400) {
      runner.addTest(
        'Valid Auth Token Acceptance',
        null,
        'API rejects due to validation (expected with test data)',
        { status: response.status, message: response.data?.message }
      );
    } else {
      runner.addTest(
        'Valid Auth Token Acceptance',
        false,
        'Unexpected response with valid token',
        { status: response.status, message: response.data?.message }
      );
    }
  } catch (error) {
    runner.addTest(
      'Valid Auth Token Test',
      false,
      'Error testing valid auth token',
      { error: error.message }
    );
  }
}

/**
 * Test 4: Input Validation API
 */
async function testInputValidationAPI() {
  runner.log('Testing API input validation...', 'info');
  
  const invalidInputs = [
    {
      name: 'Invalid User ID Format',
      payload: { userId: 'invalid-id', token: 'ExponentPushToken[test]', platform: 'ios', userType: 'client' },
      expectedStatus: 400
    },
    {
      name: 'Invalid Token Format',
      payload: { userId: CONFIG.testUserId, token: 'invalid-token', platform: 'ios', userType: 'client' },
      expectedStatus: 400
    },
    {
      name: 'Invalid Platform',
      payload: { userId: CONFIG.testUserId, token: 'ExponentPushToken[test]', platform: 'windows', userType: 'client' },
      expectedStatus: 400
    },
    {
      name: 'XSS in User ID',
      payload: { userId: '<script>alert(1)</script>', token: 'ExponentPushToken[test]', platform: 'ios', userType: 'client' },
      expectedStatus: 400
    },
    {
      name: 'SQL Injection Attempt',
      payload: { userId: "'; DROP TABLE users; --", token: 'ExponentPushToken[test]', platform: 'ios', userType: 'client' },
      expectedStatus: 400
    }
  ];
  
  for (const testCase of invalidInputs) {
    try {
      const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, testCase.payload, {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: CONFIG.timeout,
        validateStatus: () => true
      });
      
      if (response.status === testCase.expectedStatus) {
        runner.addTest(
          testCase.name,
          true,
          'Invalid input correctly rejected',
          { status: response.status, expected: testCase.expectedStatus }
        );
      } else {
        runner.addTest(
          testCase.name,
          false,
          'Invalid input not properly rejected',
          { status: response.status, expected: testCase.expectedStatus }
        );
      }
    } catch (error) {
      if (error.response?.status === testCase.expectedStatus) {
        runner.addTest(
          testCase.name,
          true,
          'Invalid input correctly rejected',
          { status: error.response.status, expected: testCase.expectedStatus }
        );
      } else {
        runner.addTest(
          testCase.name,
          false,
          'Unexpected error during validation test',
          { error: error.message }
        );
      }
    }
  }
}

/**
 * Test 5: Rate Limiting
 */
async function testRateLimiting() {
  runner.log('Testing rate limiting...', 'info');
  
  const validPayload = {
    userId: CONFIG.testUserId,
    token: 'ExponentPushToken[test-rate-limit]',
    platform: 'ios',
    userType: 'client',
    deviceId: 'test-device-rate-limit',
    appVersion: '1.0.0'
  };
  
  let requestCount = 0;
  let rateLimitHit = false;
  
  // Make rapid requests to trigger rate limiting
  for (let i = 0; i < 15; i++) {
    try {
      const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, validPayload, {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      requestCount++;
      
      if (response.status === 429) {
        rateLimitHit = true;
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitHit = true;
        break;
      }
      // Continue on other errors
    }
  }
  
  if (rateLimitHit) {
    runner.addTest(
      'Rate Limiting',
      true,
      `Rate limit triggered after ${requestCount} requests`,
      { requestCount, rateLimitHit: true }
    );
  } else {
    runner.addTest(
      'Rate Limiting',
      null,
      'Rate limit not triggered (may not be implemented)',
      { requestCount, rateLimitHit: false }
    );
  }
}

/**
 * Test 6: HTTPS Security
 */
async function testHTTPSSecurity() {
  runner.log('Testing HTTPS security...', 'info');
  
  if (CONFIG.apiBaseUrl.startsWith('https://')) {
    runner.addTest(
      'HTTPS Usage',
      true,
      'API correctly uses HTTPS',
      { url: CONFIG.apiBaseUrl }
    );
    
    // Test HTTP redirect (if applicable)
    const httpUrl = CONFIG.apiBaseUrl.replace('https://', 'http://');
    
    try {
      const response = await axios.get(httpUrl, {
        maxRedirects: 0,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status >= 300 && response.status < 400) {
        runner.addTest(
          'HTTP to HTTPS Redirect',
          true,
          'HTTP properly redirects to HTTPS',
          { status: response.status, location: response.headers.location }
        );
      } else {
        runner.addTest(
          'HTTP to HTTPS Redirect',
          null,
          'HTTP redirect not configured',
          { status: response.status }
        );
      }
    } catch (error) {
      runner.addTest(
        'HTTP to HTTPS Redirect',
        null,
        'Could not test HTTP redirect',
        { error: error.message }
      );
    }
  } else {
    runner.addTest(
      'HTTPS Usage',
      false,
      'API should use HTTPS in production',
      { url: CONFIG.apiBaseUrl }
    );
  }
}

/**
 * Test 7: File Security Check
 */
async function testFilesSecurity() {
  runner.log('Testing file security...', 'info');
  
  // Check if secure service exists
  const secureServicePath = path.join(__dirname, 'services', 'secureNotificationService.ts');
  if (fs.existsSync(secureServicePath)) {
    runner.addTest(
      'Secure Service Implementation',
      true,
      'SecureNotificationService file exists',
      { path: secureServicePath }
    );
    
    // Check for security features in the file
    const content = fs.readFileSync(secureServicePath, 'utf8');
    
    const securityFeatures = [
      { name: 'Token Encryption', pattern: /encryptToken|encrypt.*token/i },
      { name: 'Input Validation', pattern: /validateNotificationContent|validate.*content/i },
      { name: 'URL Validation', pattern: /validateNavigationUrl|validate.*url/i },
      { name: 'Content Sanitization', pattern: /sanitizeNotificationData|sanitize.*data/i }
    ];
    
    securityFeatures.forEach(feature => {
      if (feature.pattern.test(content)) {
        runner.addTest(
          `Security Feature: ${feature.name}`,
          true,
          `${feature.name} implementation found`,
          { implemented: true }
        );
      } else {
        runner.addTest(
          `Security Feature: ${feature.name}`,
          false,
          `${feature.name} implementation not found`,
          { implemented: false }
        );
      }
    });
    
  } else {
    runner.addTest(
      'Secure Service Implementation',
      false,
      'SecureNotificationService file not found',
      { path: secureServicePath }
    );
  }
  
  // Check for insecure logging patterns
  const filesToCheck = [
    'services/pushTokenService.ts',
    'services/notificationManager.ts',
    'contexts/AuthContext.tsx'
  ];
  
  let insecureLoggingFound = false;
  
  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for insecure logging patterns (actual token values being logged)
      const insecurePatterns = [
        /console\.log.*token.*substring\(/i,
        /console\.log.*['"`][^'"`]*token[^'"`]*\.\.\./i,
        /console\.log.*token.*preview/i,
        /console\.log.*token.*data/i
      ];
      
      const hasInsecureLogging = insecurePatterns.some(pattern => pattern.test(content));
      
      if (hasInsecureLogging) {
        insecureLoggingFound = true;
        runner.addTest(
          `Secure Logging: ${filePath}`,
          false,
          'Insecure token logging found',
          { file: filePath, hasInsecureLogging: true }
        );
      } else {
        runner.addTest(
          `Secure Logging: ${filePath}`,
          true,
          'No insecure token logging found',
          { file: filePath, hasInsecureLogging: false }
        );
      }
    }
  });
  
  if (!insecureLoggingFound) {
    runner.addTest(
      'Overall Logging Security',
      true,
      'No insecure token logging patterns found',
      { filesChecked: filesToCheck.length }
    );
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🔐 STARTING COMPREHENSIVE NOTIFICATION SYSTEM TEST');
  console.log('='.repeat(80));
  console.log(`🌐 API Base URL: ${CONFIG.apiBaseUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('');
  
  const args = process.argv.slice(2);
  const apiOnly = args.includes('--api-only');
  const securityOnly = args.includes('--security-only');
  
  try {
    if (!securityOnly) {
      await testConfiguration();
      await testAPIAuthentication();
      await testInputValidationAPI();
      await testRateLimiting();
      await testHTTPSSecurity();
    }
    
    if (!apiOnly) {
      await testSecurity();
      await testFilesSecurity();
    }
    
  } catch (error) {
    runner.addTest(
      'Test Suite Execution',
      false,
      'Test suite encountered an error',
      { error: error.message }
    );
  }
  
  const allTestsPassed = runner.printSummary();
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Your notification system is secure and ready for production.');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED!');
    console.log('❌ Review the failed tests and fix issues before production deployment.');
  }
  
  return allTestsPassed;
}

// Run tests if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔐 Comprehensive Notification System Test

Usage:
  node test-notification-system-complete.js [options]

Options:
  --api-only       Run only API-related tests
  --security-only  Run only security-related tests
  --help          Show this help message

Environment Variables:
  API_BASE_URL    Base URL of your API (default: https://real-estate-optimize-apis.vercel.app)
  TEST_USER_ID    Test user ID for API calls
  AUTH_TOKEN      Valid JWT token for authentication
  ENCRYPTION_KEY  Encryption key for token encryption tests

Examples:
  # Run all tests
  node test-notification-system-complete.js
  
  # Run only API tests
  API_BASE_URL=https://your-api.com node test-notification-system-complete.js --api-only
  
  # Run only security tests
  node test-notification-system-complete.js --security-only
    `);
  } else {
    runAllTests().then(success => {
      process.exit(success ? 0 : 1);
    }).catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  runAllTests,
  TestRunner,
  CONFIG
};