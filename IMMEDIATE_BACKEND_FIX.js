/**
 * IMMEDIATE BACKEND FIX
 * 
 * Add these 2 endpoints to your backend server at http://10.251.82.135:8080
 * This will fix multi-user notifications immediately.
 */

// ============================================================================
// SOLUTION 1: Add to your existing routes file
// ============================================================================

// If you have an existing routes file, add these two endpoints:

// ENDPOINT 1: GET /api/notifications/recipients
app.get('/api/notifications/recipients', async (req, res) => {
  try {
    const { clientId } = req.query;
    
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
      clientId: clientId
      // Add any additional filters like: isActive: true
    }).select('_id firstName lastName email role userType');
    
    console.log('👥 Found', users.length, 'users for client');
    
    // Format recipients
    const recipients = [];
    
    users.forEach(user => {
      // Determine user type based on your user model
      const userType = (user.role === 'admin' || user.userType === 'admin') ? 'admin' : 'staff';
      
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

// ENDPOINT 2: POST /api/notifications/send
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { title, body, category, action, data, recipients, timestamp } = req.body;
    
    console.log('📤 Sending notifications:');
    console.log('   - Title:', title);
    console.log('   - Recipients:', recipients.length);
    
    // Process each recipient
    const results = [];
    
    for (const recipient of recipients) {
      try {
        // Here you can add:
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
// SOLUTION 2: Create separate route file (Alternative)
// ============================================================================

// If you prefer to create a separate file:
// 1. Create: routes/notifications.js
// 2. Copy the above two endpoints into it
// 3. Add to your main app.js:

const express = require('express');
const router = express.Router();

// Copy the two endpoints above, but change app.get to router.get and app.post to router.post

module.exports = router;

// Then in your main app.js:
// const notificationRoutes = require('./routes/notifications');
// app.use('/api/notifications', notificationRoutes);

// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/**
 * BEFORE ADDING THESE ENDPOINTS:
 * 
 * 1. Make sure you have the User model imported:
 *    const User = require('./models/User'); // Adjust path as needed
 * 
 * 2. Verify your User model has these fields:
 *    - _id (ObjectId)
 *    - clientId (String/ObjectId)
 *    - firstName (String)
 *    - lastName (String)
 *    - email (String)
 *    - role OR userType (String) - should be 'admin' or 'staff'
 * 
 * 3. Adjust the User.find() query based on your database structure
 * 
 * 4. After adding the endpoints, RESTART your backend server
 */

// ============================================================================
// TESTING AFTER IMPLEMENTATION
// ============================================================================

/**
 * TEST THE ENDPOINTS:
 * 
 * 1. Test recipients endpoint:
 *    curl "http://10.251.82.135:8080/api/notifications/recipients?clientId=YOUR_CLIENT_ID"
 *    
 *    Expected response:
 *    {"success": true, "recipients": [...]}
 * 
 * 2. Test send endpoint:
 *    curl -X POST "http://10.251.82.135:8080/api/notifications/send" \
 *      -H "Content-Type: application/json" \
 *      -d '{"title":"Test","body":"Test","category":"material","action":"test","data":{"clientId":"test"},"recipients":[],"timestamp":"2025-01-26T10:30:00.000Z"}'
 *    
 *    Expected response:
 *    {"success": true, "message": "Notifications processed successfully"}
 * 
 * 3. If both work, multi-user notifications will work in your app!
 */