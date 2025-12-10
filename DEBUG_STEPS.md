# Debug Steps - Activity API Not Being Called

## What I Just Fixed

1. ✅ **Moved activity logging BEFORE UI updates** - Previously the modal was closing and alert showing before activity logging, which could interrupt the async call
2. ✅ **Added automatic API test on mount** - When you open the Add Project screen, it will automatically test if the Activity API is reachable
3. ✅ **Created direct API test function** - `testActivityAPICall()` to verify the endpoint works

## What Will Happen Now

### When You Open "Add Project" Screen:

You'll see these logs automatically:

```
🔍 Running Activity API test on mount...
========================================
🧪 TESTING ACTIVITY API DIRECTLY
========================================

Step 1: Getting user data from AsyncStorage...
✅ User data found: {...}

Step 2: Building test payload...
✅ Payload built: {...}

Step 3: Calling Activity API...
URL: https://your-domain.com/api/activity
Method: POST

✅ SUCCESS! Activity API is working!
Response Status: 200
Response Data: {...}
========================================
🎉 TEST PASSED - Activity API is reachable and working!
========================================
```

**OR if there's a problem:**

```
❌ TEST FAILED!
========================================
API Error Response:
  Status: 404
  Status Text: Not Found

💡 Problem: Activity API endpoint not found
   Solution: Create POST /api/activity endpoint on backend
========================================
```

### When You Create a Project:

The flow is now:

1. Create project via API ✅
2. Extract project ID ✅
3. **Log activity to Activity API** ✅ (happens BEFORE UI updates)
4. Log staff assignments ✅
5. Refresh project list ✅
6. Close modal and show success ✅

## Exact Steps to Debug

### Step 1: Open Your App

1. Open the app
2. Navigate to "Add Project" screen
3. **Check console immediately** - you should see the automatic API test

### Step 2: Check the Test Results

**If test PASSES:**

```
🎉 TEST PASSED - Activity API is reachable and working!
```

✅ Your Activity API is working! Proceed to Step 3.

**If test FAILS with 404:**

```
💡 Problem: Activity API endpoint not found
```

❌ Your backend doesn't have `/api/activity` endpoint
→ **Fix:** Create the Activity API endpoint on your backend

**If test FAILS with 400:**

```
💡 Problem: Validation error
```

❌ Activity model schema doesn't match the payload
→ **Fix:** Check your Activity model on backend

**If test FAILS with network error:**

```
💡 Problem: Cannot reach server
```

❌ Backend is not running or domain is wrong
→ **Fix:** Start your backend server or check domain in `lib/domain.ts`

**If test FAILS with "No user data":**

```
❌ No user data in AsyncStorage!
```

❌ User is not logged in
→ **Fix:** Log in first

**If test FAILS with "clientId is missing":**

```
❌ clientId is missing in user data!
```

❌ User data doesn't have clientId
→ **Fix:** Update login to save clientId (see below)

### Step 3: Create a Test Project

1. Click "Add New Project"
2. Fill in:
   - Name: "Test Activity Logging"
   - Address: "123 Test St"
   - Budget: 100000
   - Assign at least one staff member
3. Click "Add Project"
4. **Watch console carefully**

### Step 4: Check Console Logs

You should see this sequence:

```
📝 Creating project with payload: {...}
✅ Project created, response: {...}
✅ Status check passed, proceeding...
📦 Created project data: {...}
📝 Logging project creation activity...
   - Project ID: 67abc123...
   - Project Name: Test Activity Logging
   - Has projectId? true
✅ Project ID exists, proceeding with activity logging...

🔍 Running activity logger debug check...
========================================
🔍 ACTIVITY LOGGER DEBUG
========================================
✅ clientId: FOUND - your-client-id
✅ userId: FOUND - your-user-id
✅ READY: Activity logging should work!
========================================

🔄 About to call logProjectCreated...
🎯 logProjectCreated called with: {...}

========================================
🚀 ACTIVITY LOGGING STARTED
========================================
Activity Type: project_created
Category: project
Action: create

🔍 Step 1: Getting user data from AsyncStorage...
✅ User data retrieved:
   - User ID: your-user-id
   - Full Name: Your Name

🔍 Step 2: Getting client ID from AsyncStorage...
✅ Client ID retrieved: your-client-id

🔨 Step 3: Building activity payload...
✅ Activity payload built successfully

🌐 Step 4: Sending POST request to Activity API...
API Endpoint: https://your-domain.com/api/activity

✅ SUCCESS! Activity logged to API
Response Status: 200
========================================
🏁 ACTIVITY LOGGING COMPLETED
========================================

✅ logProjectCreated completed successfully
🔄 Logging staff assignments...
✅ Logged staff assignment: Staff Name
🔄 Refreshing projects list...
✅ Projects list refreshed
```

## Common Issues & Fixes

### Issue 1: Logs Stop at "Client ID is empty"

**Problem:** No clientId in AsyncStorage

**Fix:** Update your login function:

```typescript
// In your login API call
const response = await axios.post("/api/login", credentials);
const userData = response.data;

// Save with clientId
await AsyncStorage.setItem(
  "user",
  JSON.stringify({
    _id: userData._id,
    clientId: userData.clientId, // ← MUST HAVE THIS
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
  })
);
```

### Issue 2: Logs Stop at "Sending POST request"

**Problem:** Network error or API endpoint doesn't exist

**Check:**

1. Is backend running?
2. Does `/api/activity` endpoint exist?
3. Is domain correct in `lib/domain.ts`?

**Test manually:**

```bash
curl -X POST https://your-domain.com/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"userId": "test", "fullName": "Test"},
    "clientId": "test",
    "activityType": "project_created",
    "category": "project",
    "action": "create",
    "description": "Test"
  }'
```

### Issue 3: API Returns 400 Error

**Problem:** Validation error

**Fix:** Check your Activity model schema matches this:

```typescript
{
  user: {
    userId: String (required),
    fullName: String (required),
    email: String (optional)
  },
  clientId: String (required),
  projectId: String (optional),
  projectName: String (optional),
  activityType: String (required, enum),
  category: String (required, enum),
  action: String (required, enum),
  description: String (required)
}
```

### Issue 4: No Logs at All

**Problem:** Code not running

**Check:**

1. Did you save the file?
2. Did you reload the app?
3. Is console open?

**Try:**

- Restart the app
- Clear cache: `npx react-native start --reset-cache`

## Verify It Worked

### Method 1: Check Database

```javascript
db.activities
  .find({
    activityType: "project_created",
  })
  .sort({ createdAt: -1 })
  .limit(1);
```

### Method 2: Query Activity API

```bash
curl "https://your-domain.com/api/activity?clientId=your-client-id&limit=5"
```

### Method 3: Check Console

Look for:

```
✅ SUCCESS! Activity logged to API
Response Status: 200
```

## Still Not Working?

### Share These Logs:

1. **Automatic test result** (when you open Add Project screen)
2. **Project creation logs** (when you create a project)
3. **Any error messages**

### Check These Files:

1. `lib/domain.ts` - Is domain correct?
2. Backend `/api/activity` - Does endpoint exist?
3. Activity model - Does schema match?

## Expected Timeline

- **Automatic test:** Runs immediately when you open Add Project screen
- **Activity logging:** Happens immediately after project is created
- **Total time:** < 2 seconds

If activity logging takes longer or doesn't happen, there's a network or API issue.
