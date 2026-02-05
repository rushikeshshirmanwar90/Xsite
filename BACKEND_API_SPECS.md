# Backend API Specifications for Notification System

## Overview
These APIs need to be implemented in your backend to support the multi-user notification system for the client-admin-staff hierarchy.

## 🔗 Required Endpoints

### 1. POST `/api/notifications/send`
**Purpose**: Send notifications to multiple users based on client hierarchy

**Request Body**:
```json
{
  "title": "📦 Materials Imported",
  "body": "John Smith imported 5 materials (₹15,000) in Project Alpha",
  "category": "material",
  "action": "imported",
  "data": {
    "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "projectName": "Project Alpha",
    "sectionName": "Foundation",
    "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "triggeredBy": {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "fullName": "John Smith",
      "userType": "staff"
    },
    "materials": [
      {
        "name": "Cement",
        "qnt": 10,
        "unit": "bags",
        "totalCost": 5000
      }
    ],
    "totalCost": 15000,
    "route": "project"
  },
  "recipients": [
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "userType": "admin",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fullName": "Admin User",
      "email": "admin@example.com"
    }
  ],
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "data": {
    "notificationsSent": 2,
    "pushNotificationsSent": 2,
    "failedRecipients": []
  }
}
```

**Implementation Logic**:
```javascript
// Pseudo-code for backend implementation
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { title, body, category, action, data, recipients, timestamp } = req.body;
    
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
      
      // Send push notification
      if (recipient.pushToken) {
        await sendPushNotification(recipient.pushToken, title, body, data);
      }
      
      results.push({ userId: recipient.userId, status: 'sent' });
    }
    
    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        notificationsSent: results.length,
        pushNotificationsSent: results.filter(r => r.status === 'sent').length,
        failedRecipients: results.filter(r => r.status === 'failed')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

### 2. GET `/api/notifications/recipients`
**Purpose**: Get list of users who should receive notifications for a project

**Query Parameters**:
- `clientId` (required): Client ID
- `projectId` (required): Project ID

**Example Request**:
```
GET /api/notifications/recipients?clientId=64f8a1b2c3d4e5f6a7b8c9d1&projectId=64f8a1b2c3d4e5f6a7b8c9d0
```

**Response**:
```json
{
  "success": true,
  "recipients": [
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "userType": "admin",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fullName": "Admin User 1",
      "email": "admin1@example.com",
      "pushToken": "ExponentPushToken[xxx]"
    },
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "userType": "admin",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fullName": "Admin User 2",
      "email": "admin2@example.com",
      "pushToken": "ExponentPushToken[yyy]"
    },
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d5",
      "userType": "staff",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fullName": "Staff User 1",
      "email": "staff1@example.com",
      "pushToken": "ExponentPushToken[zzz]"
    }
  ]
}
```

**Implementation Logic**:
```javascript
app.get('/api/notifications/recipients', async (req, res) => {
  try {
    const { clientId, projectId } = req.query;
    
    // 1. Get all admins for this client
    const admins = await User.find({
      clientId: clientId,
      role: 'admin',
      isActive: true
    }).select('_id firstName lastName email pushToken role');
    
    // 2. Get staff assigned to this project
    const project = await Project.findById(projectId).populate('assignedStaff');
    const assignedStaff = project.assignedStaff || [];
    
    // 3. Combine and format recipients
    const recipients = [];
    
    // Add all admins
    admins.forEach(admin => {
      recipients.push({
        userId: admin._id,
        userType: 'admin',
        clientId: clientId,
        fullName: `${admin.firstName} ${admin.lastName}`.trim(),
        email: admin.email,
        pushToken: admin.pushToken
      });
    });
    
    // Add assigned staff
    assignedStaff.forEach(staff => {
      recipients.push({
        userId: staff._id,
        userType: 'staff',
        clientId: clientId,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
        email: staff.email,
        pushToken: staff.pushToken
      });
    });
    
    res.json({
      success: true,
      recipients: recipients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

### 3. GET `/api/notifications`
**Purpose**: Get notifications for current user

**Query Parameters**:
- `clientId` (required): Client ID
- `userId` (required): User ID
- `limit` (optional): Number of notifications to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `unreadOnly` (optional): Return only unread notifications (default: false)

**Example Request**:
```
GET /api/notifications?clientId=64f8a1b2c3d4e5f6a7b8c9d1&userId=64f8a1b2c3d4e5f6a7b8c9d3&limit=20&unreadOnly=true
```

**Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "title": "📦 Materials Imported",
      "body": "John Smith imported 5 materials (₹15,000) in Project Alpha",
      "category": "material",
      "action": "imported",
      "data": {
        "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "projectName": "Project Alpha",
        "route": "project"
      },
      "timestamp": "2025-01-25T10:30:00.000Z",
      "isRead": false,
      "receivedAt": "2025-01-25T10:30:01.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "unreadCount": 12
}
```

**Implementation Logic**:
```javascript
app.get('/api/notifications', async (req, res) => {
  try {
    const { clientId, userId, limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    // Build query
    const query = {
      userId: userId,
      clientId: clientId
    };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    // Get notifications with pagination
    const notifications = await UserNotification.find(query)
      .populate('notificationId')
      .sort({ receivedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    // Get total count
    const total = await UserNotification.countDocuments(query);
    const unreadCount = await UserNotification.countDocuments({
      userId: userId,
      clientId: clientId,
      isRead: false
    });
    
    // Format response
    const formattedNotifications = notifications.map(un => ({
      id: un._id,
      title: un.notificationId.title,
      body: un.notificationId.body,
      category: un.notificationId.category,
      action: un.notificationId.action,
      data: un.notificationId.data,
      timestamp: un.notificationId.timestamp,
      isRead: un.isRead,
      receivedAt: un.receivedAt
    }));
    
    res.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

### 4. PUT `/api/notifications/:id/read`
**Purpose**: Mark notification as read

**Request Body**:
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d3"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 5. DELETE `/api/notifications/:id`
**Purpose**: Delete notification

**Request Body**:
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d3"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 📊 Database Schema

### Notifications Collection
```javascript
{
  _id: ObjectId,
  title: String,
  body: String,
  category: String, // 'material', 'project', 'staff', etc.
  action: String,   // 'imported', 'used', 'transferred', etc.
  data: Object,     // Additional data for the notification
  clientId: ObjectId,
  timestamp: Date,
  createdAt: Date
}
```

### UserNotifications Collection
```javascript
{
  _id: ObjectId,
  notificationId: ObjectId, // Reference to Notifications
  userId: ObjectId,
  isRead: Boolean,
  receivedAt: Date,
  readAt: Date
}
```

---

## 🔧 Push Notification Setup

### Using Expo Push Notifications
```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(pushToken, title, body, data) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}
```

---

## 🧪 Testing the APIs

### Test Notification Recipients
```bash
curl -X GET "http://localhost:3000/api/notifications/recipients?clientId=64f8a1b2c3d4e5f6a7b8c9d1&projectId=64f8a1b2c3d4e5f6a7b8c9d0"
```

### Test Send Notification
```bash
curl -X POST "http://localhost:3000/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification",
    "category": "material",
    "action": "imported",
    "data": {
      "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d1"
    },
    "recipients": [
      {
        "userId": "64f8a1b2c3d4e5f6a7b8c9d3",
        "userType": "admin",
        "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "fullName": "Test Admin"
      }
    ],
    "timestamp": "2025-01-25T10:30:00.000Z"
  }'
```

---

## 🚀 Implementation Priority

1. **High Priority**: 
   - `POST /api/notifications/send`
   - `GET /api/notifications/recipients`

2. **Medium Priority**:
   - `GET /api/notifications`
   - Database schema setup

3. **Low Priority**:
   - Push notification setup
   - Mark as read/delete endpoints

Once you implement the first two endpoints, the enhanced notification system will start working immediately!