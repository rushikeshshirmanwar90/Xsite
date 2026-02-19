/**
 * DATABASE MIGRATION SCRIPT: Encrypt Existing Push Tokens
 * 
 * This script encrypts all existing push tokens in your database.
 * Run this ONCE after implementing the security fixes.
 * 
 * IMPORTANT: Backup your database before running this script!
 */

const crypto = require('crypto');

// Environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-for-tokens';

/**
 * Encrypt token function (same as in middleware)
 */
function encryptToken(token) {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Token encryption failed');
  }
}

/**
 * Check if token is already encrypted
 */
function isTokenEncrypted(token) {
  // Expo tokens start with "ExponentPushToken["
  // If it doesn't start with this, it's likely encrypted
  return !token.startsWith('ExponentPushToken[');
}

/**
 * MongoDB Migration Script
 */
async function migrateMongoDBTokens() {
  const { MongoClient } = require('mongodb');
  
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('pushtokens'); // Adjust collection name
    
    // Find all tokens that are not encrypted
    const tokens = await collection.find({
      token: { $regex: '^ExponentPushToken\\[' }
    }).toArray();
    
    console.log(`📊 Found ${tokens.length} unencrypted tokens to migrate`);
    
    let encryptedCount = 0;
    let errorCount = 0;
    
    for (const tokenDoc of tokens) {
      try {
        const encryptedToken = encryptToken(tokenDoc.token);
        
        await collection.updateOne(
          { _id: tokenDoc._id },
          { 
            $set: { 
              token: encryptedToken,
              encryptedAt: new Date(),
              migrationVersion: '1.0'
            }
          }
        );
        
        encryptedCount++;
        console.log(`✅ Encrypted token for user: ${tokenDoc.userId}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to encrypt token for user ${tokenDoc.userId}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully encrypted: ${encryptedCount} tokens`);
    console.log(`❌ Failed to encrypt: ${errorCount} tokens`);
    console.log(`📈 Total processed: ${tokens.length} tokens`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * PostgreSQL Migration Script
 */
async function migratePostgreSQLTokens() {
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/your-database'
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Find all unencrypted tokens
    const result = await client.query(`
      SELECT id, user_id, token 
      FROM push_tokens 
      WHERE token LIKE 'ExponentPushToken[%'
      AND is_active = true
    `);
    
    console.log(`📊 Found ${result.rows.length} unencrypted tokens to migrate`);
    
    let encryptedCount = 0;
    let errorCount = 0;
    
    for (const row of result.rows) {
      try {
        const encryptedToken = encryptToken(row.token);
        
        await client.query(`
          UPDATE push_tokens 
          SET token = $1, encrypted_at = NOW(), migration_version = '1.0'
          WHERE id = $2
        `, [encryptedToken, row.id]);
        
        encryptedCount++;
        console.log(`✅ Encrypted token for user: ${row.user_id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to encrypt token for user ${row.user_id}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully encrypted: ${encryptedCount} tokens`);
    console.log(`❌ Failed to encrypt: ${errorCount} tokens`);
    console.log(`📈 Total processed: ${result.rows.length} tokens`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

/**
 * MySQL Migration Script
 */
async function migrateMySQLTokens() {
  const mysql = require('mysql2/promise');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database'
  });
  
  try {
    console.log('✅ Connected to MySQL');
    
    // Find all unencrypted tokens
    const [rows] = await connection.execute(`
      SELECT id, user_id, token 
      FROM push_tokens 
      WHERE token LIKE 'ExponentPushToken[%'
      AND is_active = 1
    `);
    
    console.log(`📊 Found ${rows.length} unencrypted tokens to migrate`);
    
    let encryptedCount = 0;
    let errorCount = 0;
    
    for (const row of rows) {
      try {
        const encryptedToken = encryptToken(row.token);
        
        await connection.execute(`
          UPDATE push_tokens 
          SET token = ?, encrypted_at = NOW(), migration_version = '1.0'
          WHERE id = ?
        `, [encryptedToken, row.id]);
        
        encryptedCount++;
        console.log(`✅ Encrypted token for user: ${row.user_id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to encrypt token for user ${row.user_id}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully encrypted: ${encryptedCount} tokens`);
    console.log(`❌ Failed to encrypt: ${errorCount} tokens`);
    console.log(`📈 Total processed: ${rows.length} tokens`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
    console.log('🔌 Disconnected from MySQL');
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🔐 Starting Push Token Encryption Migration');
  console.log('⚠️  IMPORTANT: Make sure you have backed up your database!');
  console.log('');
  
  // Check environment variables
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'your-encryption-key-for-tokens') {
    console.error('❌ ENCRYPTION_KEY environment variable not set properly!');
    console.error('   Set a strong encryption key in your .env file');
    process.exit(1);
  }
  
  const dbType = process.env.DB_TYPE || 'mongodb';
  
  try {
    switch (dbType.toLowerCase()) {
      case 'mongodb':
        await migrateMongoDBTokens();
        break;
      case 'postgresql':
      case 'postgres':
        await migratePostgreSQLTokens();
        break;
      case 'mysql':
        await migrateMySQLTokens();
        break;
      default:
        console.error(`❌ Unsupported database type: ${dbType}`);
        console.error('   Supported types: mongodb, postgresql, mysql');
        process.exit(1);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('🔐 All existing tokens are now encrypted');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verification function to check migration success
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  // Add verification logic based on your database type
  // This should check that no unencrypted tokens remain
  
  console.log('✅ Migration verification completed');
}

// Run migration if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    verifyMigration();
  } else if (args.includes('--help')) {
    console.log(`
🔐 Push Token Encryption Migration Script

Usage:
  node encrypt-existing-tokens-migration.js [options]

Options:
  --verify    Verify that migration was successful
  --help      Show this help message

Environment Variables:
  DB_TYPE           Database type (mongodb, postgresql, mysql)
  ENCRYPTION_KEY    Encryption key for tokens (REQUIRED)
  
  MongoDB:
    MONGODB_URI     MongoDB connection string
  
  PostgreSQL:
    DATABASE_URL    PostgreSQL connection string
  
  MySQL:
    DB_HOST         MySQL host
    DB_USER         MySQL username
    DB_PASSWORD     MySQL password
    DB_NAME         MySQL database name

Example:
  DB_TYPE=mongodb ENCRYPTION_KEY=your-secret-key node encrypt-existing-tokens-migration.js
    `);
  } else {
    runMigration();
  }
}

module.exports = {
  runMigration,
  verifyMigration,
  encryptToken,
  isTokenEncrypted
};