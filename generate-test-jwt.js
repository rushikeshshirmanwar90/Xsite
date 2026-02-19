#!/usr/bin/env node

/**
 * Generate a valid JWT token for testing the notification system
 */

const jwt = require('jsonwebtoken');

// Use the same secret as the backend
const JWT_SECRET = 'your-super-secret-jwt-key-here';

// Test user data
const testUser = {
  id: '676b0b4b4c8c5b4d8e9f1234',
  email: 'test@example.com',
  userType: 'client',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
};

// Generate JWT token
const token = jwt.sign(testUser, JWT_SECRET, { algorithm: 'HS256' });

console.log('Generated JWT Token:');
console.log(token);
console.log('\nToken payload:');
console.log(JSON.stringify(testUser, null, 2));
console.log('\nTo use this token, set the AUTH_TOKEN environment variable:');
console.log(`export AUTH_TOKEN="${token}"`);
console.log('\nOr run the test with:');
console.log(`AUTH_TOKEN="${token}" node test-notification-system-complete.js`);