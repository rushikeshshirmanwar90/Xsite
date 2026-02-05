# Backend Implementation Ready - Notification System

## 🎯 Current Status
- ✅ Frontend notification system architecture complete
- ✅ Enhanced notification service designed
- ✅ Material activity logging with notification support
- ✅ Local notification fallback system
- ❌ **MISSING: Backend API endpoints for multi-user targeting**

## 🚀 Ready-to-Implement Backend APIs

### 1. POST `/api/notifications/send` - CRITICAL
```javascript
// File: /api/notifications/send.js (or similar)
const express = require('express');
const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { title, body, category, action, data, recipients, timestamp } = req.body;
    
    console.log('📤 Sending notifications to', recipients.length, 'recipients');
    
    // 1. Store notification in database
    const notification = await Notification.create({
      title,
      body,
      category,
      action,
      data,
      timestamp,
      clientId: data.clientId
    });
    
    // 2. Send to each recipient
    const results = [];
    for (const recipient of recipients) {
      // Store user-specific notification
      await UserNotification.create({
        notificationId: notification._id,
        userId: recipient.userId,
        isRead: false,
        receivedAt: new Date()
      });
      
      // TODO: Send push notification here
      // await sendPushNotification(recipient.pushToken, title, body, data);
      
      results.push({ userId: recipient.userId, status: 'sent' });
    }
    
    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        notificationsSent: results.length,
        pushNotificationsSent: 0, // Update when push notifications implemented
        failedRecipients: []
      }
    });
  } catch (error) {
    console.error('Notification send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. GET `/api/notifications/recipients` - CRITICAL
```javascript
// File: /api/notifications/recipients.js
router.get('/recipients', async (req, res) => {
  try {
    const { clientId, projectId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'clientId is required'
      });
    }
    
    console.log('🔍 Getting recipients for client:', clientId, 'project:', projectId);
    
    // 1. Get all admins for this client
    const admins = await User.find({
      clientId: clientId,
      $or: [
        { role: 'admin' },
        { userType: 'admin' }
      ],
      isActive: { $ne: false } // Include users where isActive is not explicitly false
    }).select('_id firstName lastName email pushToken role userType');
    
    console.log('👥 Found', admins.length, 'admins for client');
    
    // 2. Get staff assigned to this project (if projectId provided)
    let assignedStaff = [];
    if (projectId) {
      const project = await Project.findById(projectId).populate('assignedStaff');
      assignedStaff = project?.assignedStaff || [];
      console.log('👷 Found', assignedStaff.length, 'assigned staff for project');
    } else {
      // If no specific project, get all staff for this client
      assignedStaff = await User.find({
        clientId: clientId,
        $or: [
          { role: 'staff' },
          { userType: 'staff' }
        ],
        isActive: { $ne: false }
      }).select('_id firstName lastName email pushToken role userType');
      console.log('👷 Found', assignedStaff.length, 'staff for client');
    }
    
    // 3. Combine and format recipients
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
    
    // Add assigned staff
    assignedStaff.forEach(staff => {
      recipients.push({
        userId: staff._id.toString(),
        userType: 'staff',
        clientId: clientId,
        fullName: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff User',
        email: staff.email,
        pushToken: staff.pushToken
      });
    });
    
    console.log('✅ Total recipients:', recipients.length);
    
    res.json({
      success: true,
      recipients: recipients
    });
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 3. Database Schema Setup
```javascript
// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true }, // 'material', 'project', 'staff'
  action: { type: String, required: true },   // 'imported', 'used', 'transferred'
  data: { type: Object, required: true },     // Additional data
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// UserNotification Schema (for tracking read status per user)
const userNotificationSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isRead: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

const Notification = mongoose.model('Notification', notificationSchema);
const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
```

## 🧪 Testing Your Implementation

### Test 1: Check Recipients API
```bash
# Replace with your actual domain and IDs
curl "http://localhost:3000/api/notifications/recipients?clientId=YOUR_CLIENT_ID&projectId=YOUR_PROJECT_ID"
```

### Test 2: Send Test Notification
```bash
curl -X POST "http://localhost:3000/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Test Notification",
    "body": "Testing multi-user notification system",
    "category": "material",
    "action": "imported",
    "data": {
      "projectId": "YOUR_PROJECT_ID",
      "clientId": "YOUR_CLIENT_ID",
      "triggeredBy": {
        "userId": "YOUR_USER_ID",
        "fullName": "Test User",
        "userType": "staff"
      }
    },
    "recipients": [
      {
        "userId": "ADMIN_USER_ID",
        "userType": "admin",
        "clientId": "YOUR_CLIENT_ID",
        "fullName": "Admin User"
      }
    ],
    "timestamp": "2025-01-26T10:30:00.000Z"
  }'
```

## 🔧 Integration Steps

### Step 1: Add API Routes to Your Backend
```javascript
// In your main app.js or routes/index.js
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);
```

### Step 2: Update Material Activity Endpoint
```javascript
// In your existing /api/materialActivity endpoint, add this after saving activity:

// After successfully saving material activity
if (activityData.success) {
  try {
    // Get notification recipients
    const recipientsResponse = await axios.get(
      `${process.env.BASE_URL}/api/notifications/recipients?clientId=${clientId}&projectId=${projectId}`
    );
    
    if (recipientsResponse.data.success && recipientsResponse.data.recipients.length > 0) {
      // Create notification payload
      const notificationPayload = {
        title: `📦 Materials ${activity === 'imported' ? 'Imported' : activity === 'used' ? 'Used' : 'Transferred'}`,
        body: `${user.fullName} ${activity} ${materials.length} material${materials.length > 1 ? 's' : ''} in ${projectName}`,
        category: 'material',
        action: activity,
        data: {
          projectId,
          projectName,
          sectionName,
          clientId,
          triggeredBy: {
            userId: user.userId,
            fullName: user.fullName,
            userType: 'staff' // or determine from user data
          },
          materials,
          route: 'project'
        },
        recipients: recipientsResponse.data.recipients.filter(r => r.userId !== user.userId),
        timestamp: new Date().toISOString()
      };
      
      // Send notifications
      await axios.post(`${process.env.BASE_URL}/api/notifications/send`, notificationPayload);
      console.log('✅ Notifications sent for material activity');
    }
  } catch (notificationError) {
    console.error('⚠️ Notification sending failed:', notificationError.message);
    // Don't fail the main request if notifications fail
  }
}
```

## 🎯 Expected Results After Implementation

1. **Staff imports materials** → **All client admins get notified**
2. **Admin performs activity** → **Other admins in same client get notified**
3. **Users only see notifications for their client's projects**
4. **User who performed action doesn't get notified**

## 🚨 Critical Implementation Notes

1. **User Model Fields**: Ensure your User model has:
   - `clientId` field
   - `role` or `userType` field ('admin' or 'staff')
   - `firstName`, `lastName` fields
   - `email` field
   - Optional: `pushToken` for push notifications

2. **Project Model**: Ensure your Project model has:
   - `assignedStaff` field (array of user IDs)
   - `clientId` field

3. **Error Handling**: The notification system should never break the main material activity flow

4. **Testing**: Test with multiple user accounts (at least 1 admin and 1 staff per client)

## 🔄 Next Steps After Backend Implementation

1. **Deploy backend changes**
2. **Test with multiple users**
3. **Verify notifications appear correctly**
4. **Add push notification service (optional)**
5. **Add notification preferences (optional)**

The frontend is 100% ready - once you implement these backend endpoints, the multi-user notification system will work immediately!