/**
 * EXACT SOLUTION: Add these routes to your backend
 * 
 * Backend URL: http://10.251.82.135:8080
 * 
 * STEP 1: Create this file in your backend project
 * STEP 2: Add to your main app.js or server.js
 * STEP 3: Restart your backend server
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// ENDPOINT 1: GET /api/notifications/recipients
// This endpoint returns users who should receive notifications
// ============================================================================

router.get('/recipients', async (req, res) => {
  try {
    const { clientId, projectId } = req.query;
    
    console.log('🔍 Getting notification recipients for clientId:', clientId);
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'clientId is required'
      });
    }
    
    // Get all users for this client
    // IMPORTANT: Adjust this query based on your User model structure
    const users = await User.find({
      clientId: clientId,
      // Add any additional filters (isActive, etc.)
    }).select('_id firstName lastName email role userType');
    
    console.log('👥 Found', users.length, 'users for client');
    
    // Format recipients
    const recipients = [];
    
    users.forEach(user => {
      // Determine user type (adjust based on your user model)
      const userType = user.role === 'admin' || user.userType === 'admin' ? 'admin' : 'staff';
      
      recipients.push({
        userId: user._id.toString(),
        userType: userType,
        clientId: clientId,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        email: user.email
      });
    });
    
    console.log('✅ Returning', recipients.length, 'recipients');
    
    res.json({
      success: true,
      recipients: recipients
    });
    
  } catch (error) {
    console.error('❌ Get recipients error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ENDPOINT 2: POST /api/notifications/send
// This endpoint receives and processes notifications
// ============================================================================

router.post('/send', async (req, res) => {
  try {
    const { title, body, category, action, data, recipients, timestamp } = req.body;
    
    console.log('📤 Sending notifications:');
    console.log('   - Title:', title);
    console.log('   - Recipients:', recipients.length);
    
    // Process each recipient
    const results = [];
    
    for (const recipient of recipients) {
      try {
        // Here you can add logic to:
        // 1. Store notification in database (optional)
        // 2. Send push notification (optional)
        // 3. Send email notification (optional)
        
        console.log(`✅ Notification processed for ${recipient.fullName} (${recipient.userType})`);
        
        results.push({
          userId: recipient.userId,
          fullName: recipient.fullName,
          status: 'sent'
        });
        
      } catch (recipientError) {
        console.error(`❌ Failed to process notification for ${recipient.fullName}:`, recipientError);
        results.push({
          userId: recipient.userId,
          fullName: recipient.fullName,
          status: 'failed',
          error: recipientError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    console.log(`✅ Notification processing completed: ${successCount} sent, ${failedCount} failed`);
    
    res.json({
      success: true,
      message: 'Notifications processed successfully',
      data: {
        notificationsSent: successCount,
        failedRecipients: results.filter(r => r.status === 'failed'),
        results: results
      }
    });
    
  } catch (error) {
    console.error('❌ Send notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// EXPORT THE ROUTER
// ============================================================================

module.exports = router;

// ============================================================================
// INTEGRATION INSTRUCTIONS
// ============================================================================

/**
 * HOW TO ADD THESE ROUTES TO YOUR BACKEND:
 * 
 * METHOD 1: Create separate route file (Recommended)
 * 
 * 1. Save this file as: routes/notifications.js (or similar)
 * 
 * 2. In your main app.js or server.js, add:
 *    ```javascript
 *    const notificationRoutes = require('./routes/notifications');
 *    app.use('/api/notifications', notificationRoutes);
 *    ```
 * 
 * 3. Restart your backend server
 * 
 * METHOD 2: Add directly to existing routes
 * 
 * 1. Copy the two router functions above
 * 2. Add them to your existing routes file
 * 3. Change router.get to app.get and router.post to app.post
 * 4. Restart your backend server
 * 
 * EXAMPLE INTEGRATION:
 * ```javascript
 * // In your main app.js or server.js
 * const express = require('express');
 * const app = express();
 * 
 * // Your existing routes...
 * 
 * // Add notification routes
 * const notificationRoutes = require('./routes/notifications');
 * app.use('/api/notifications', notificationRoutes);
 * 
 * // Start server
 * app.listen(8080, () => {
 *   console.log('Server running on port 8080');
 * });
 * ```
 */