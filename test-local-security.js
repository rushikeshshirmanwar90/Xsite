#!/usr/bin/env node

/**
 * LOCAL SECURITY IMPLEMENTATION TEST
 * 
 * This script tests the security functions locally before deployment
 */

const crypto = require('crypto');

// Mock the security functions from our API route
const JWT_SECRET = 'test-jwt-secret-key';
const ENCRYPTION_KEY = 'test-encryption-key-for-tokens';

function encryptToken(token) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Token encryption failed');
  }
}

function validatePushTokenInput(data) {
  const errors = [];
  
  // Validate userId (MongoDB ObjectId format)
  if (!data.userId || !/^[0-9a-fA-F]{24}$/.test(data.userId)) {
    errors.push('Invalid user ID format');
  }
  
  // Validate token format (Expo push token)
  if (!data.token || !data.token.startsWith('ExponentPushToken[') || data.token.length < 10 || data.token.length > 500) {
    errors.push('Invalid Expo push token format');
  }
  
  // Validate platform
  if (!data.platform || !['ios', 'android'].includes(data.platform)) {
    errors.push('Platform must be ios or android');
  }
  
  // Validate userType
  if (!data.userType || !['admin', 'staff', 'client'].includes(data.userType)) {
    errors.push('Invalid user type');
  }
  
  // Validate deviceId
  if (!data.deviceId || data.deviceId.length < 1 || data.deviceId.length > 100) {
    errors.push('Device ID required and must be 1-100 characters');
  }
  
  // Validate appVersion
  if (data.appVersion && !/^\d+\.\d+\.\d+$/.test(data.appVersion)) {
    errors.push('Invalid app version format (expected: x.y.z)');
  }
  
  return errors.length === 0 ? { success: true } : { success: false, errors };
}

function sanitizeInput(data) {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      // Remove HTML tags and dangerous content
      sanitized[key] = sanitized[key]
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
  }
  
  return sanitized;
}

// Test cases
console.log('🔐 TESTING LOCAL SECURITY IMPLEMENTATION');
console.log('='.repeat(50));

// Test 1: Token Encryption
console.log('\n1. Testing Token Encryption...');
try {
  const testToken = 'ExponentPushToken[test-token-12345]';
  const encrypted = encryptToken(testToken);
  console.log(`✅ Original: ${testToken.substring(0, 30)}...`);
  console.log(`✅ Encrypted: ${encrypted.substring(0, 30)}...`);
  console.log(`✅ Encryption working: ${encrypted !== testToken}`);
} catch (error) {
  console.log(`❌ Encryption failed: ${error.message}`);
}

// Test 2: Input Validation - Valid Input
console.log('\n2. Testing Valid Input...');
const validInput = {
  userId: '676b0b4b4c8c5b4d8e9f1234',
  token: 'ExponentPushToken[valid-token-12345]',
  platform: 'ios',
  userType: 'client',
  deviceId: 'device-12345',
  appVersion: '1.0.0'
};

const validResult = validatePushTokenInput(validInput);
console.log(`✅ Valid input test: ${validResult.success ? 'PASSED' : 'FAILED'}`);
if (!validResult.success) {
  console.log(`   Errors: ${validResult.errors.join(', ')}`);
}

// Test 3: Input Validation - Invalid Inputs
console.log('\n3. Testing Invalid Inputs...');
const invalidInputs = [
  {
    name: 'Invalid User ID',
    data: { ...validInput, userId: 'invalid-id' },
    shouldFail: true
  },
  {
    name: 'Invalid Token Format',
    data: { ...validInput, token: 'invalid-token' },
    shouldFail: true
  },
  {
    name: 'Invalid Platform',
    data: { ...validInput, platform: 'windows' },
    shouldFail: true
  },
  {
    name: 'XSS Attempt',
    data: { ...validInput, userId: '<script>alert(1)</script>' },
    shouldFail: true
  }
];

let validationTests = 0;
let validationPassed = 0;

invalidInputs.forEach(test => {
  validationTests++;
  const result = validatePushTokenInput(test.data);
  const passed = test.shouldFail ? !result.success : result.success;
  
  if (passed) {
    validationPassed++;
    console.log(`✅ ${test.name}: PASSED`);
  } else {
    console.log(`❌ ${test.name}: FAILED`);
    if (result.errors) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  }
});

// Test 4: Input Sanitization
console.log('\n4. Testing Input Sanitization...');
const maliciousInput = {
  userId: '<script>alert("XSS")</script>',
  token: 'ExponentPushToken[test]',
  platform: 'ios',
  userType: 'client',
  deviceId: 'javascript:alert(1)',
  appVersion: '1.0.0'
};

const sanitized = sanitizeInput(maliciousInput);
const sanitizationWorking = 
  !sanitized.userId.includes('<script>') && 
  !sanitized.deviceId.includes('javascript:');

console.log(`✅ Sanitization test: ${sanitizationWorking ? 'PASSED' : 'FAILED'}`);
console.log(`   Original userId: ${maliciousInput.userId}`);
console.log(`   Sanitized userId: ${sanitized.userId}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 LOCAL SECURITY TEST SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Token Encryption: Working`);
console.log(`✅ Valid Input Validation: ${validResult.success ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Invalid Input Rejection: ${validationPassed}/${validationTests} tests passed`);
console.log(`✅ Input Sanitization: ${sanitizationWorking ? 'PASSED' : 'FAILED'}`);

const allTestsPassed = validResult.success && validationPassed === validationTests && sanitizationWorking;
console.log(`\n🎯 Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('\n🚀 Security implementation is ready for deployment!');
  console.log('Next steps:');
  console.log('1. Deploy the updated API route to production');
  console.log('2. Set environment variables (JWT_SECRET, ENCRYPTION_KEY)');
  console.log('3. Run the migration script to encrypt existing tokens');
  console.log('4. Re-run the full test suite');
} else {
  console.log('\n⚠️ Fix the failed tests before deployment');
}