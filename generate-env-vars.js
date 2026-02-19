#!/usr/bin/env node

/**
 * ENVIRONMENT VARIABLES GENERATOR
 * 
 * Generates secure environment variables for production deployment
 */

const crypto = require('crypto');

console.log('🔐 GENERATING SECURE ENVIRONMENT VARIABLES');
console.log('='.repeat(60));

// Generate JWT Secret (64 characters for extra security)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (for authentication):');
console.log(`JWT_SECRET=${jwtSecret}`);

// Generate Encryption Key (64 characters for extra security)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n🔒 ENCRYPTION_KEY (for token encryption):');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

console.log('\n' + '='.repeat(60));
console.log('📋 COPY THESE TO YOUR PRODUCTION ENVIRONMENT:');
console.log('='.repeat(60));

console.log(`
# Add these to your .env file or production environment variables:

JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# For Vercel:
# 1. Go to your project dashboard
# 2. Settings → Environment Variables
# 3. Add both variables above

# For other platforms:
# Add these variables to your deployment configuration
`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('- Keep these values secret and secure');
console.log('- Never commit them to version control');
console.log('- Use different values for development and production');
console.log('- Rotate these keys regularly (monthly recommended)');

console.log('\n✅ Environment variables generated successfully!');
console.log('🚀 Ready for production deployment.');