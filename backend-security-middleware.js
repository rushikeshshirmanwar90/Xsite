/**
 * SECURITY MIDDLEWARE FOR PUSH TOKEN ENDPOINTS
 * Add this to your backend API server
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Environment variables (add to your .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-for-tokens';

/**
 * SECURITY FIX: Authentication middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

/**
 * SECURITY FIX: Rate limiting middleware
 */
const pushTokenRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many push token requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SECURITY FIX: Input validation middleware
 */
const validatePushTokenInput = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('token')
    .isLength({ min: 10, max: 500 })
    .withMessage('Invalid token format')
    .matches(/^ExponentPushToken\[/)
    .withMessage('Invalid Expo push token format'),
  body('platform')
    .isIn(['ios', 'android'])
    .withMessage('Platform must be ios or android'),
  body('userType')
    .isIn(['admin', 'staff', 'client'])
    .withMessage('Invalid user type'),
  body('deviceId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Device ID required'),
  body('appVersion')
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Invalid app version format')
];

/**
 * SECURITY FIX: Token encryption functions
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

function decryptToken(encryptedToken) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Token decryption failed');
  }
}

/**
 * SECURITY FIX: Security logging middleware
 */
function securityLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  console.log(`🔐 SECURITY LOG: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    console.log(`🔐 SECURITY LOG: ${logLevel} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log security events
    if (res.statusCode === 401) {
      console.warn('🚨 SECURITY ALERT: Unauthorized access attempt', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
}

/**
 * SECURITY FIX: Input sanitization
 */
function sanitizeInput(req, res, next) {
  if (req.body) {
    // Remove any HTML tags and scripts
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script.*?>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/data:text\/html/gi, '')
          .trim();
      }
    }
  }
  next();
}

/**
 * EXAMPLE: Secure push token registration endpoint
 */
function setupSecurePushTokenEndpoints(app) {
  
  // POST /api/push-token - Register push token
  app.post('/api/push-token', 
    pushTokenRateLimit,
    securityLogger,
    authenticateToken,
    sanitizeInput,
    validatePushTokenInput,
    async (req, res) => {
      try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
        }
        
        const { userId, token, platform, userType, deviceId, appVersion } = req.body;
        
        // Verify user owns this userId
        if (req.user.id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot register token for another user'
          });
        }
        
        // Encrypt token before storing
        const encryptedToken = encryptToken(token);
        
        // Store in database (implement your database logic here)
        const tokenRecord = {
          userId,
          token: encryptedToken, // Store encrypted
          platform,
          userType,
          deviceId,
          appVersion,
          isActive: true,
          createdAt: new Date(),
          lastUsed: new Date()
        };
        
        // Save to database
        // const result = await PushToken.create(tokenRecord);
        
        console.log('✅ Push token registered securely', {
          userId,
          platform,
          userType,
          tokenLength: token.length,
          timestamp: new Date().toISOString()
        });
        
        res.status(201).json({
          success: true,
          message: 'Push token registered successfully',
          data: {
            tokenId: 'generated-token-id',
            isNew: true
          }
        });
        
      } catch (error) {
        console.error('❌ Push token registration error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );
  
  // GET /api/push-token - Get user's push tokens
  app.get('/api/push-token',
    pushTokenRateLimit,
    securityLogger,
    authenticateToken,
    async (req, res) => {
      try {
        const { userId } = req.query;
        
        // Verify user can access this data
        if (req.user.id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot access another user\'s tokens'
          });
        }
        
        // Get tokens from database (implement your database logic here)
        // const tokens = await PushToken.find({ userId, isActive: true });
        
        // Decrypt tokens for response (if needed)
        // const decryptedTokens = tokens.map(t => ({
        //   ...t,
        //   token: decryptToken(t.token)
        // }));
        
        res.json({
          success: true,
          message: 'Tokens retrieved successfully',
          data: {
            count: 0, // tokens.length
            tokens: [] // decryptedTokens
          }
        });
        
      } catch (error) {
        console.error('❌ Push token retrieval error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );
  
  // DELETE /api/push-token - Deactivate push token
  app.delete('/api/push-token',
    pushTokenRateLimit,
    securityLogger,
    authenticateToken,
    async (req, res) => {
      try {
        const { userId } = req.query;
        
        // Verify user can deactivate this token
        if (req.user.id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot deactivate another user\'s tokens'
          });
        }
        
        // Deactivate tokens in database (implement your database logic here)
        // await PushToken.updateMany(
        //   { userId, isActive: true },
        //   { isActive: false, deactivatedAt: new Date() }
        // );
        
        console.log('✅ Push tokens deactivated', {
          userId,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          success: true,
          message: 'Push tokens deactivated successfully'
        });
        
      } catch (error) {
        console.error('❌ Push token deactivation error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );
}

module.exports = {
  authenticateToken,
  pushTokenRateLimit,
  validatePushTokenInput,
  securityLogger,
  sanitizeInput,
  encryptToken,
  decryptToken,
  setupSecurePushTokenEndpoints
};

/**
 * USAGE EXAMPLE:
 * 
 * const express = require('express');
 * const { setupSecurePushTokenEndpoints } = require('./backend-security-middleware');
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * // Setup secure endpoints
 * setupSecurePushTokenEndpoints(app);
 * 
 * app.listen(3000, () => {
 *   console.log('Secure API server running on port 3000');
 * });
 */