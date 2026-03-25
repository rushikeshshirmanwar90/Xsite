# Quick Fix Guide - License Not Showing

## The Problem
You're seeing "License Expired - License information not available" even though you have 365 days in the database.

## Root Cause
**Redis cache contains old data without the license field.**

## Immediate Fix (Choose One)

### Option 1: Clear Cache via Script (Easiest)

```bash
cd real-estate-apis
node scripts/clear-client-cache.js --all
```

### Option 2: Clear Cache via API

Using curl:
```bash
curl -X POST http://localhost:3000/api/clients/clear-cache \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

Using Postman:
- Method: POST
- URL: `http://localhost:3000/api/clients/clear-cache`
- Body (JSON):
  ```json
  {
    "clearAll": true
  }
  ```

### Option 3: Clear Redis Directly

```bash
redis-cli FLUSHDB
```

## After Clearing Cache

1. **Close your mobile app completely**
2. **Reopen the app**
3. **Go to Profile page**
4. **Pull down to refresh**

You should now see:
- ✅ "365 days left" (or your actual license days)
- ✅ Blue badge with time icon
- ✅ License details showing correctly

## Verify It Worked

Check the console logs in your mobile app. You should see:

```
🔍 Fetching client data for ID: [your-id]
✅ Client license value: 365
✅ Client license type: number
✅ Final license value being set: 365
✅ Client data set successfully
```

## If Still Not Working

1. **Check your client ID in the database:**
   ```javascript
   // In MongoDB
   db.clients.findOne({ email: "your-email@example.com" })
   ```
   
   Verify the `license` field exists and has value 365.

2. **Check the API response:**
   ```bash
   curl http://localhost:3000/api/clients?id=YOUR_CLIENT_ID
   ```
   
   The response should include:
   ```json
   {
     "success": true,
     "data": {
       "license": 365,
       "isLicenseActive": true,
       "licenseExpiryDate": "2026-03-24T..."
     }
   }
   ```

3. **Check cache status:**
   ```bash
   curl http://localhost:3000/api/clients/clear-cache?clientId=YOUR_CLIENT_ID
   ```
   
   Should show:
   ```json
   {
     "isCached": false,  // or true with hasLicenseField: true
     "hasLicenseField": true,
     "licenseValue": 365
   }
   ```

## Need Help?

If the issue persists:
1. Share the console logs from the mobile app
2. Share the API response from `/api/clients?id=YOUR_ID`
3. Share the cache status from `/api/clients/clear-cache?clientId=YOUR_ID`

## Files Changed

- ✅ `Xsite/app/(tabs)/profile.tsx` - Added cache-busting
- ✅ `real-estate-apis/app/api/clients/clear-cache/route.ts` - New cache management endpoint
- ✅ `real-estate-apis/scripts/clear-client-cache.js` - Helper script

## Prevention

This won't happen again because:
1. Mobile app now bypasses cache with timestamp parameter
2. Mobile app includes better license field validation
3. You now have tools to clear cache when needed
