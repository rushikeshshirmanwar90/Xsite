# Troubleshooting Activity Logging

## Problem: Activity API Not Being Called When Creating Project

### Quick Diagnosis

Run this in your app to check if AsyncStorage has the required data:

```typescript
import { debugActivityLogger } from "@/utils/debugActivityLogger";

// Call this when your app loads or in a useEffect
debugActivityLogger();
```

### Common Issues & Solutions

#### Issue 1: Missing Client ID ❌

**Symptom:** Console shows "Client ID is empty!" or "Skipping activity log due to missing clientId"

**Cause:** User data in AsyncStorage doesn't have `clientId` field

**Solution:**

```typescript
// When user logs in, make sure to save clientId:
const userData = {
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  clientId: user.clientId, // ← REQUIRED!
};

await AsyncStorage.setItem("user", JSON.stringify(userData));
```

**Check Current Data:**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const checkUserData = async () => {
  const user = await AsyncStorage.getItem("user");
  console.log("Current user data:", JSON.parse(user));
};
```

---

#### Issue 2: User Not Logged In ❌

**Symptom:** Console shows "No 'user' data found in AsyncStorage"

**Cause:** User hasn't logged in or login didn't save data properly

**Solution:**

1. Make sure user logs in before creating projects
2. Verify login flow saves user data to AsyncStorage
3. Check login API response includes all required fields

---

#### Issue 3: Network Error ❌

**Symptom:** Console shows "Network Error: No response received from server"

**Cause:** Activity API endpoint not reachable

**Solution:**

1. Check if backend server is running
2. Verify `domain` variable in `lib/domain.ts` is correct
3. Test API endpoint manually:
   ```bash
   curl -X POST https://your-domain.com/api/activity \
     -H "Content-Type: application/json" \
     -d '{"user":{"userId":"test","fullName":"Test"},"clientId":"test","activityType":"project_created","category":"project","action":"create","description":"Test"}'
   ```

---

#### Issue 4: API Returns 400 Error ❌

**Symptom:** Console shows "Status: 400" with validation error

**Cause:** Activity API validation failing

**Solution:**

1. Check Activity model schema on backend
2. Verify all required fields are being sent
3. Check enum values match (e.g., `activityType: "project_created"`)

**Required Fields:**

- `user.userId` (string)
- `user.fullName` (string)
- `clientId` (string)
- `activityType` (enum value)
- `category` (enum value)
- `action` (enum value)
- `description` (string)

---

#### Issue 5: API Returns 404 Error ❌

**Symptom:** Console shows "Status: 404"

**Cause:** Activity API endpoint doesn't exist

**Solution:**

1. Create the Activity API endpoint at `/api/activity`
2. Verify route is properly configured
3. Check backend logs for routing errors

---

### Step-by-Step Debugging

#### Step 1: Check Console Logs

When you create a project, you should see these logs in order:

```
📝 Creating project with payload: {...}
✅ Project created, response: {...}
✅ Status check passed, proceeding...
📝 Logging project creation activity...
   - Project ID: [some-id]
   - Project Name: [project-name]
   - Has projectId? true
✅ Project ID exists, proceeding with activity logging...

🔍 Running activity logger debug check...
========================================
🔍 ACTIVITY LOGGER DEBUG
========================================
1️⃣ Checking AsyncStorage for 'user' key...
✅ User data found in AsyncStorage
2️⃣ Parsing user data...
✅ User data parsed successfully
3️⃣ Checking required fields...
✅ clientId: FOUND - [client-id]
✅ userId: FOUND - [user-id]
✅ fullName: FOUND - [user-name]
========================================
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
...
🌐 Step 4: Sending POST request to Activity API...
✅ SUCCESS! Activity logged to API
========================================
```

#### Step 2: If Logs Stop Early

**If logs stop at "Client ID is empty!":**

- User data doesn't have `clientId`
- Fix: Update login to save `clientId`

**If logs stop at "No 'user' data found":**

- User not logged in
- Fix: Ensure user logs in first

**If logs stop at "Sending POST request":**

- Network or API error
- Check console for error details
- Verify API endpoint exists

#### Step 3: Test Activity API Directly

Run the test script:

```bash
npx ts-node scripts/testActivityAPI.ts
```

This will test the Activity API independently of your app.

---

### Manual Testing Checklist

- [ ] User is logged in
- [ ] AsyncStorage has 'user' key
- [ ] User data has `clientId` field
- [ ] User data has `_id` or `id` field
- [ ] User data has name fields (firstName/lastName or name)
- [ ] Backend server is running
- [ ] Activity API endpoint exists at `/api/activity`
- [ ] Activity model is properly configured
- [ ] Network connectivity is working

---

### Quick Fixes

#### Fix 1: Add clientId to User Data

```typescript
// In your login function:
const loginUser = async (credentials) => {
  const response = await axios.post("/api/login", credentials);
  const userData = response.data;

  // Make sure clientId is included
  const userToSave = {
    ...userData,
    clientId: userData.clientId || userData._id, // Fallback if needed
  };

  await AsyncStorage.setItem("user", JSON.stringify(userToSave));
};
```

#### Fix 2: Test Without Login (Development Only)

```typescript
// Temporarily add test data to AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

const addTestUser = async () => {
  const testUser = {
    _id: "test-user-123",
    clientId: "test-client-123",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
  };

  await AsyncStorage.setItem("user", JSON.stringify(testUser));
  console.log("✅ Test user added to AsyncStorage");
};

// Call this once, then try creating a project
addTestUser();
```

#### Fix 3: Verify API Endpoint

Create a simple test in your backend:

```typescript
// In your Activity API route
export const POST = async (req: Request) => {
  console.log("📥 Activity API called");
  console.log("Body:", await req.json());

  // ... rest of your code
};
```

---

### Still Not Working?

1. **Enable verbose logging:** All logs are already enabled in the updated code
2. **Check backend logs:** Look for errors on the server side
3. **Test with Postman:** Send a manual request to the Activity API
4. **Check MongoDB:** Verify database connection is working
5. **Review Activity model:** Ensure schema matches the payload

---

### Success Indicators

You'll know it's working when you see:

1. ✅ Console shows "SUCCESS! Activity logged to API"
2. ✅ Response status is 200 or 201
3. ✅ Activity appears in database
4. ✅ GET request to Activity API returns the logged activity

---

### Need More Help?

Check these files:

- `utils/activityLogger.ts` - Main logging functions
- `utils/debugActivityLogger.ts` - Debug helper
- `ACTIVITY_LOGGING_INTEGRATION.md` - Complete documentation
- `scripts/testActivityAPI.ts` - API test script
