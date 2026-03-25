# Troubleshooting: License Not Showing

## Problem
Still seeing "No License Data" even after cache fixes.

## Root Causes (Multiple Possibilities)

### 1. Redis Cache Still Serving Old Data
Even with `skipCache` parameter, Redis might still be caching.

### 2. License Field Missing in Database
The `license` field might not exist in your MongoDB document.

### 3. Client Model Schema Issue
The schema might not include the `license` field.

## Step-by-Step Diagnosis

### Step 1: Check Database Directly

Run this in MongoDB shell or Compass:

```javascript
db.clients.findOne({ email: "your-email@example.com" })
```

**Expected Output:**
```json
{
  "_id": "...",
  "name": "Your Company",
  "email": "your-email@example.com",
  "license": 365,  // ← This field MUST exist
  "isLicenseActive": true,
  "licenseExpiryDate": "2026-03-24T..."
}
```

**If `license` field is missing**, add it:

```javascript
db.clients.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      license: 365,
      isLicenseActive: true,
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    } 
  }
)
```

### Step 2: Clear Redis Cache Completely

**Option A: Using the API**
```bash
curl -X POST http://localhost:3000/api/clients/clear-cache \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

**Option B: Using Redis CLI**
```bash
redis-cli FLUSHDB
```

**Option C: Using the script**
```bash
cd real-estate-apis
node scripts/clear-client-cache.js --all
```

### Step 3: Test API Directly

Test the API with `skipCache` parameter:

```bash
curl "http://localhost:3000/api/clients?id=YOUR_CLIENT_ID&skipCache=true"
```

**Check the response:**
```json
{
  "success": true,
  "message": "Client retrieved successfully (fresh)",
  "data": {
    "_id": "...",
    "license": 365,  // ← Should be here
    "isLicenseActive": true
  }
}
```

**If `license` is missing in API response**, the problem is in the database, not the cache.

### Step 4: Check Client Model Schema

Open `real-estate-apis/lib/models/super-admin/Client.ts` (or similar):

```typescript
const ClientSchema = new Schema({
  name: String,
  email: String,
  // ... other fields ...
  license: { type: Number, default: 0 },  // ← Must be here
  isLicenseActive: { type: Boolean, default: false },
  licenseExpiryDate: Date,
});
```

**If missing**, add these fields to the schema.

### Step 5: Restart Backend Server

After any schema changes:

```bash
# Stop the server
# Then restart
cd real-estate-apis
npm run dev
```

### Step 6: Test Mobile App

1. **Close app completely** (swipe away from recent apps)
2. **Clear app cache** (if possible on your device)
3. **Reopen app**
4. **Go to Profile page**
5. **Pull down to refresh**

### Step 7: Check Console Logs

In your mobile app console, you should see:

```
🔍 Fetching client data for ID: [your-id]
✅ Client license value: 365
✅ Client license type: number
✅ Final license value being set: 365
```

**If you see:**
```
⚠️ No license field in response
```

The problem is in the database or API, not the mobile app.

## Quick Fixes

### Fix 1: Add License Field to Existing Client

```javascript
// In MongoDB shell or using Mongoose
db.clients.updateMany(
  { license: { $exists: false } },  // Find clients without license field
  { 
    $set: { 
      license: 365,  // Default to 365 days
      isLicenseActive: true,
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    } 
  }
)
```

### Fix 2: Force Fresh Data in Mobile App

The app now uses `skipCache=true` which forces fresh data from database.

### Fix 3: Verify Client ID

Make sure you're using the correct client ID:

```bash
# Check what client ID the app is using
# Look in console logs for:
🎯 Final clientId determined: [should be a valid MongoDB ObjectId]
```

## Common Issues

### Issue 1: "Client not found (404)"

**Cause:** Wrong client ID or client doesn't exist.

**Fix:** Verify the client ID in the database matches what the app is using.

### Issue 2: "License field missing but isLicenseActive is true"

**Cause:** Old cached data or database missing `license` field.

**Fix:** 
1. Clear Redis cache
2. Add `license` field to database
3. Restart backend

### Issue 3: License shows as `null` in console

**Cause:** Database document doesn't have `license` field.

**Fix:** Run the MongoDB update command from Fix 1 above.

## Verification Checklist

- [ ] Database has `license` field with value 365
- [ ] Redis cache cleared
- [ ] Backend server restarted
- [ ] Mobile app closed and reopened
- [ ] API returns `license: 365` when called with `skipCache=true`
- [ ] Console logs show "License field found in response: 365"
- [ ] Profile page shows "365 days left" instead of "No License Data"

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Share these logs:**
   - MongoDB query result: `db.clients.findOne({ email: "your-email" })`
   - API response: `curl "http://localhost:3000/api/clients?id=YOUR_ID&skipCache=true"`
   - Mobile console logs (the ones starting with 🔍, ✅, ⚠️)

2. **Check these files:**
   - `real-estate-apis/lib/models/super-admin/Client.ts` - Schema definition
   - `real-estate-apis/app/api/clients/route.ts` - API endpoint
   - `Xsite/app/(tabs)/profile.tsx` - Mobile app code

3. **Verify environment:**
   - Backend server is running
   - MongoDB is running
   - Redis is running
   - Mobile app can reach the backend (check domain/IP)

## Emergency Fix

If nothing works, bypass the cache completely by modifying the backend:

In `real-estate-apis/app/api/clients/route.ts`, comment out all cache logic:

```typescript
// Get specific Client by ID
if (id) {
  if (!isValidObjectId(id)) {
    return errorResponse("Invalid client ID format", 400);
  }

  // TEMPORARILY DISABLE CACHE
  // let cacheValue = await client.get(`client:${id}`);
  // if (cacheValue) { ... }

  const clientData = await Client.findById(id).select("-password").lean();
  if (!clientData) {
    return errorResponse("Client not found", 404);
  }

  // TEMPORARILY DISABLE CACHE
  // await client.set(`client:${id}`, ...);

  return successResponse(clientData, "Client retrieved successfully");
}
```

This forces every request to hit the database directly.
