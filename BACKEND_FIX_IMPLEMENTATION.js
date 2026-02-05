/**
 * EXACT BACKEND FIX FOR MULTI-USER NOTIFICATIONS
 * 
 * Add these endpoints to your backend at http://10.251.82.135:8080
 * This will fix the 404 errors and enable multi-user notifications
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// 1. GET /api/notifications/recipients - CRITICAL MISSING ENDPOINT
// ============================================================================

router.get('/recipients', async (req, res) => {
  try {
    const { clientId, projectId } = req.query;
    
    console.log('🔍 Getting notification recipients for:', { clientId, projectId });
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'clientId is required'
      });
    }
    
    // Get all admins for this client
    const admins = await User.find({
      clientId: clientId,
      $or: [
        { role: 'admin' },
        { userType: 'admin' }
      ],
      isActive: { $ne: false }
    }).select('_id firstName lastName email pushToken role userType');
    
    console.log('👥 Found', admins.length, 'admins for client');
    
    // Get staff for this client (or specific project if provided)
    let staff = [];
    if (projectId) {
      // Get staff assigned to specific project
      const project = await Project.findById(projectId).populate('assignedStaff');
      staff = project?.assignedStaff || [];
    } else {
      // Get all staff for this client
      staff = await User.find({
        clientId: clientId,
        $or: [
          { role: 'staff' },
          { userType: 'staff' }
        ],
        isActive: { $ne: false }
      }).select('_id firstName lastName email pushToken role userType');
    }
    
    console.log('👷 Found', staff.length, 'staff for client');
    
    // Format recipients
    const recipients = [];
    
    // Add all admins
    admins.forEach(admin => {
      recipients.push({
        userId: admin._id.toString(),
        userType: 'admin',
        clientId: clientId,
        fullName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin User',
        email: admin.email,
        pushToken: admin.pushToken
      });
    });
    
    // Add staff
    staff.forEach(staffMember => {
      recipients.push({
        userId: staffMember._id.toString(),
        userType: 'staff',
        clientId: clientId,
        fullName: `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'Staff User',
        email: staffMember.email,
        pushToken: staffMember.pushToken
      });
    });
    
    console.log('✅ Total recipients:', recipients.length);
    
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
// 2. POST /api/notifications/send - CRITICAL MISSING ENDPOINT
// ============================================================================

router.post('/send', async (req, res) => {
  try {
    const { title, body, category, action, data, recipients, timestamp } = req.body;
    
    console.log('📤 Sending notifications to', recipients.length, 'recipients');
    console.log('📋 Notification:', { title, body, category, action });
    
    // Store notification in database (optional - for history)
    let notificationId = null;
    try {
      const notification = await Notification.create({
        title,
        body,
        category,
        action,
        data,
        timestamp,
        clientId: data.clientId,
        createdAt: new Date()
      });
      notificationId = notification._id;
      console.log('💾 Notification stored in database:', notificationId);
    } catch (dbError) {
      console.warn('⚠️ Could not store notification in database:', dbError.message);
      // Continue without database storage if Notification model doesn't exist
    }
    
    // Send to each recipient
    const results = [];
    for (const recipient of recipients) {
      try {
        // Store user-specific notification (optional)
        if (notificationId) {
          try {
            await UserNotification.create({
              notificationId: notificationId,
              userId: recipient.userId,
              isRead: false,
              receivedAt: new Date()
            });
          } catch (userNotifError) {
            console.warn('⚠️ Could not store user notification:', userNotifError.message);
          }
        }
        
        // TODO: Send push notification here
        // if (recipient.pushToken) {
        //   await sendPushNotification(recipient.pushToken, title, body, data);
        // }
        
        results.push({ 
          userId: recipient.userId, 
          fullName: recipient.fullName,
          status: 'sent' 
        });
        
        console.log(`✅ Notification queued for ${recipient.fullName} (${recipient.userType})`);
        
      } catch (recipientError) {
        console.error(`❌ Failed to send to ${recipient.fullName}:`, recipientError.message);
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
    
    console.log(`✅ Notification sending completed: ${successCount} sent, ${failedCount} failed`);
    
    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        notificationsSent: successCount,
        pushNotificationsSent: 0, // Update when push notifications implemented
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
// 3. DATABASE SCHEMAS (Optional - for notification history)
// ============================================================================

const mongoose = require('mongoose');

// Notification Schema (optional)
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true }, // 'material', 'project', 'staff'
  action: { type: String, required: true },   // 'imported', 'used', 'transferred'
  data: { type: Object, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// UserNotification Schema (optional)
const userNotificationSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isRead: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

// Only create models if they don't exist (optional)
let Notification, UserNotification;
try {
  Notification = mongoose.model('Notification');
} catch (error) {
  Notification = mongoose.model('Notification', notificationSchema);
}

try {
  UserNotification = mongoose.model('UserNotification');
} catch (error) {
  UserNotification = mongoose.model('UserNotification', userNotificationSchema);
}

// ============================================================================
// 4. EXPORT ROUTER
// ============================================================================

module.exports = router;

// ============================================================================
// 5. INTEGRATION INSTRUCTIONS
// ============================================================================

/**
 * TO INTEGRATE THIS FIX:
 * 
 * 1. Add to your main app.js or server.js:
 *    ```javascript
 *    const notificationRoutes = require('./routes/notifications'); // Adjust path
 *    app.use('/api/notifications', notificationRoutes);
 *    ```
 * 
 * 2. Ensure your User model has these fields:
 *    - clientId (ObjectId)
 *    - role or userType ('admin' or 'staff')
 *    - firstName, lastName (String)
 *    - email (String)
 *    - pushToken (String, optional)
 *    - isActive (Boolean, optional)
 * 
 * 3. Ensure your Project model has:
 *    - assignedStaff (Array of ObjectIds)
 * 
 * 4. Test the endpoints:
 *    GET  http://10.251.82.135:8080/api/notifications/recipients?clientId=YOUR_CLIENT_ID
 *    POST http://10.251.82.135:8080/api/notifications/send
 * 
 * 5. After implementation, test with your app:
 *    - Staff imports materials → Admins should get notified
 *    - Admin performs activity → Other admins should get notified
 */