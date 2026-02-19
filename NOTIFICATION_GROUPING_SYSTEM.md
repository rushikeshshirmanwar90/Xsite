# 🎯 Notification Grouping System

## 🚨 **Problem Solved**

**Before:** All users received notifications regardless of their relationship to the project or client.
**After:** Notifications are properly grouped by clientId and filtered to relevant users only.

## ✅ **New Notification Rules**

### **1. Client-Based Grouping**
- **Admins** only receive notifications for their own clients
- **Staff** only receive notifications for projects they're assigned to
- **No cross-client notifications** - Client A's activities don't notify Client B's users

### **2. Self-Notification Prevention**
- **Users don't receive notifications** for their own actions
- **Prevents spam** from users' own activities
- **Cleaner notification experience**

### **3. Logout Protection**
- **Inactive tokens** are automatically filtered out
- **Logged out users** don't receive notifications
- **Token cleanup** removes old/invalid tokens

## 🔧 **How It Works**

### **Token Registration (Enhanced)**
```typescript
// Now includes clientId for proper grouping
{
  userId: "staff123",
  userType: "staff",
  token: "ExponentPushToken[...]",
  clientId: "client456", // ✅ NEW: Links user to specific client
  platform: "android",
  isActive: true
}
```

### **Notification Sending (Enhanced)**
```typescript
// Now includes clientId and staffId for filtering
{
  projectId: "project789",
  type: "material_added",
  title: "Material Added by John",
  message: "Added 10 bags of cement",
  recipientType: "admins",
  clientId: "client456", // ✅ Only notify this client's users
  staffId: "staff123",   // ✅ Don't notify the person who did the action
}
```

## 📊 **Notification Flow**

### **Scenario 1: Staff Adds Material**
1. **Staff member** adds material to Project A (Client X)
2. **System finds** all admins for Client X only
3. **System filters out** the staff member who added the material
4. **Notification sent** to Client X's admins only
5. **Result:** Only relevant admins notified, no self-notification

### **Scenario 2: Admin Updates Project**
1. **Admin** updates Project B (Client Y)
2. **System finds** all staff assigned to Client Y's projects
3. **System filters out** the admin who made the update
4. **Notification sent** to Client Y's staff only
5. **Result:** Only relevant staff notified, no self-notification

### **Scenario 3: Cross-Client Protection**
1. **Client A's staff** adds material
2. **System checks** clientId = "clientA"
3. **Client B's users** are not in the recipient list
4. **Result:** Client B users receive no notification

## 🎯 **Database Structure**

### **Enhanced PushToken Model**
```typescript
{
  userId: String,        // User who owns the token
  userType: String,      // 'admin', 'staff', 'client-admin'
  clientId: ObjectId,    // ✅ NEW: Links to specific client
  token: String,         // Push notification token
  isActive: Boolean,     // ✅ Filters out logged out users
  platform: String,     // 'ios', 'android', 'web'
  healthMetrics: {       // ✅ Token health tracking
    isHealthy: Boolean,
    failureCount: Number
  }
}
```

### **Efficient Queries**
```typescript
// Find admins for specific client only
PushToken.find({
  clientId: targetClientId,
  userType: { $in: ['admin', 'client-admin'] },
  isActive: true,
  'healthMetrics.isHealthy': true
});

// Find staff for specific client only
PushToken.find({
  clientId: targetClientId,
  userType: 'staff',
  isActive: true,
  'healthMetrics.isHealthy': true
});
```

## 🔍 **ClientId Resolution**

### **For Staff Users**
1. **Check assignedProjects** → Use first project's clientId
2. **Check clients array** → Use first client assignment
3. **Fallback** → Manual clientId in user data

### **For Admin Users**
1. **Check if user is client** → Use userId as clientId
2. **Check client assignments** → Use assigned clientId
3. **Fallback** → Manual clientId in user data

### **Automatic Detection**
```typescript
// Staff clientId from projects
staff.assignedProjects[0].clientId

// Staff clientId from client assignments
staff.clients[0].clientId

// Admin as client
admin._id === client._id ? admin._id : null
```

## 📱 **Frontend Integration**

### **Enhanced Material Form**
```typescript
await sendProjectNotification({
  projectId: "project123",
  activityType: 'material_added',
  staffName: user.name,
  projectName: "Villa Project",
  details: "Added 10 bags of cement (₹5,000)",
  recipientType: 'admins',
  staffId: user._id,     // ✅ Prevent self-notification
  clientId: user.clientId // ✅ Target specific client
});
```

### **Automatic ClientId Storage**
```typescript
// Stored during token registration
await AsyncStorage.setItem('registeredClientId', clientId);

// Used in subsequent notifications
const clientId = await AsyncStorage.getItem('registeredClientId');
```

## 🎯 **Benefits**

### **1. Privacy & Security**
- **No data leakage** between clients
- **Proper access control** based on relationships
- **Clean separation** of client data

### **2. Better User Experience**
- **Relevant notifications only** - no spam
- **No self-notifications** - cleaner experience
- **Faster delivery** - smaller recipient lists

### **3. System Performance**
- **Efficient queries** with clientId indexing
- **Smaller notification batches** per client
- **Better error tracking** per client group

### **4. Scalability**
- **Easy to add new clients** without affecting others
- **Independent notification systems** per client
- **Isolated failure handling** per client group

## 🔧 **Testing the System**

### **Test Scenario 1: Same Client**
1. **Login as Staff A** (Client X)
2. **Add material** to Project 1
3. **Check:** Only Client X's admins get notification
4. **Check:** Staff A doesn't get self-notification

### **Test Scenario 2: Different Clients**
1. **Login as Staff B** (Client Y)
2. **Add material** to Project 2
3. **Check:** Client X users get no notification
4. **Check:** Only Client Y's admins get notification

### **Test Scenario 3: Logged Out Users**
1. **Logout Staff C**
2. **Another staff adds material**
3. **Check:** Staff C gets no notification (token inactive)

## 📊 **Console Logs to Watch**

```
📋 Found clientId from project: 64f8a1b2c3d4e5f6a7b8c9d0
🔍 Looking for admins recipients for clientId: 64f8a1b2c3d4e5f6a7b8c9d0...
📋 Found 2 admin recipients for client 64f8a1b2c3d4e5f6a7b8c9d0
🚫 Filtered out action performer: 2 → 1 recipients
📨 Prepared 1 messages to send for client 64f8a1b2c3d4e5f6a7b8c9d0
✅ Successfully sent 1 notifications to client 64f8a1b2c3d4e5f6a7b8c9d0
```

## 🎉 **Summary**

The notification system now provides:
- ✅ **Client-based grouping** - no cross-client notifications
- ✅ **Self-notification prevention** - users don't notify themselves
- ✅ **Logout protection** - inactive users don't get notifications
- ✅ **Efficient targeting** - only relevant users notified
- ✅ **Better privacy** - proper data isolation
- ✅ **Scalable architecture** - easy to add new clients

Your notification system is now enterprise-ready with proper user grouping and privacy controls!