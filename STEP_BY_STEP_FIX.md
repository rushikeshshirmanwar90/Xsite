# 🔧 Step-by-Step Fix for Backend Notification APIs

## 🎯 **Problem Summary**
Your frontend is calling these APIs but they don't exist in your backend:
- `GET /api/notifications/recipients` → 404 Not Found
- `POST /api/notifications/send` → 404 Not Found

## 🚀 **Solution: Add 2 API Endpoints (15-30 minutes)**

### Step 1: Locate Your Backend Project
Your backend is running at `http://10.251.82.135:8080`
- Find your backend project folder
- Look for your main server file (usually `app.js`, `server.js`, or `index.js`)

### Step 2: Add Notification Routes

#### Option A: Create New Route File (Recommended)

1. **Create new file:** `routes/notifications.js` (or similar path)
2. **Copy content from:** `BACKEND_NOTIFICATION_ROUTES.js`
3. **Add to main server file:**
   ```javascript
   // Add this to your app.js or server.js
   const notificationRoutes = require('./routes/notifications');
   app.use('/api/notifications', notificationRoutes);
   ```

#### Option B: Add to Existing Routes

1. **Open your existing routes file**
2. **Add these two endpoints:**
   ```javascript
   // GET /api/notifications/recipients
   app.get('/api/notifications/recipients', async (req, res) => {
     // Copy the recipients endpoint code from BACKEND_NOTIFICATION_ROUTES.js
   });

   // POST /api/notifications/send  
   app.post('/api/notifications/send', async (req, res) => {
     // Copy the send endpoint code from BACKEND_NOTIFICATION_ROUTES.js
   });
   ```

### Step 3: Verify Your User Model

Make sure your User model has these fields:
```javascript
{
  _id: ObjectId,
  clientId: String/ObjectId,    // ✅ Required
  firstName: String,            // ✅ Required  
  lastName: String,             // ✅ Required
  email: String,                // ✅ Required
  role: String,                 // ✅ Required ('admin' or 'staff')
  // OR userType: String        // ✅ Alternative to role
}
```

### Step 4: Restart Backend Server
```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm start
# or
node app.js
# or whatever command you use
```

### Step 5: Test the Fix

#### Quick Test with curl:
```bash
# Test recipients endpoint
curl "http://10.251.82.135:8080/api/notifications/recipients?clientId=YOUR_CLIENT_ID"

# Expected: JSON response with recipients array
# Before fix: 404 Not Found
# After fix: {"success": true, "recipients": [...]}
```

#### Test with your app:
1. Open your React Native app
2. Try importing materials or performing any material activity
3. Check if other users receive notifications

---

## 📋 **Detailed Implementation Example**

### If your backend structure looks like this:
```
backend/
├── app.js (main server file)
├── routes/
│   ├── users.js
│   ├── projects.js
│   └── materialActivity.js
├── models/
│   ├── User.js
│   └── Project.js
└── package.json
```

### Add notification routes:

1. **Create:** `routes/notifications.js`
   ```javascript
   // Copy entire content from BACKEND_NOTIFICATION_ROUTES.js
   ```

2. **Update:** `app.js`
   ```javascript
   const express = require('express');
   const app = express();

   // Your existing routes
   app.use('/api/users', require('./routes/users'));
   app.use('/api/projects', require('./routes/projects'));
   app.use('/api/materialActivity', require('./routes/materialActivity'));

   // ADD THIS LINE:
   app.use('/api/notifications', require('./routes/notifications'));

   app.listen(8080, () => {
     console.log('Server running on port 8080');
   });
   ```

3. **Restart server**

---

## 🧪 **Testing After Implementation**

### Test 1: Check API Endpoints
```bash
# Should return recipients instead of 404
curl "http://10.251.82.135:8080/api/notifications/recipients?clientId=test"

# Should accept notification instead of 404  
curl -X POST "http://10.251.82.135:8080/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test","category":"material","action":"test","data":{"clientId":"test"},"recipients":[],"timestamp":"2025-01-26T10:30:00.000Z"}'
```

### Test 2: Multi-User Notifications
1. **Create 2 user accounts** (1 admin, 1 staff) for same client
2. **Login as staff** and import materials
3. **Check admin account** - should see notification about staff's activity
4. **Login as admin** and perform activity  
5. **Check staff account** - should see notification about admin's activity

---

## 🎯 **Expected Results After Fix**

### Before Fix:
```
❌ GET /api/notifications/recipients → 404 Not Found
❌ POST /api/notifications/send → 404 Not Found
❌ Staff imports materials → Only staff sees local notification
❌ No cross-user notifications
```

### After Fix:
```
✅ GET /api/notifications/recipients → Returns user list
✅ POST /api/notifications/send → Accepts notifications
✅ Staff imports materials → All client admins get notified
✅ Admin activity → Other client admins get notified
✅ Cross-user notifications working
```

---

## 🚨 **Common Issues & Solutions**

### Issue 1: "User is not defined"
**Problem:** User model not imported
**Solution:** Add `const User = require('./models/User');` to your routes file

### Issue 2: "Cannot find module './routes/notifications'"
**Problem:** Wrong file path
**Solution:** Adjust the require path to match your folder structure

### Issue 3: Still getting 404 after adding routes
**Problem:** Server not restarted or routes not properly added
**Solution:** 
1. Restart backend server completely
2. Check console for any startup errors
3. Verify routes are added correctly

### Issue 4: Recipients array is empty
**Problem:** No users found for client or wrong query
**Solution:** 
1. Check if users exist in database for the client
2. Verify clientId format (string vs ObjectId)
3. Check User model field names

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check server console** for error messages when starting
2. **Verify User model** has required fields
3. **Test endpoints with curl** before testing in app
4. **Check network connectivity** to http://10.251.82.135:8080

The fix is straightforward - just add the 2 missing API endpoints and restart your server. Once done, multi-user notifications will work immediately! 🚀

---

## 📁 **Files to Use:**
- `BACKEND_NOTIFICATION_ROUTES.js` - Complete route code
- `quick-api-test.js` - Test the endpoints after implementation
- `NOTIFICATION_VERIFICATION_TEST.tsx` - Test in your app