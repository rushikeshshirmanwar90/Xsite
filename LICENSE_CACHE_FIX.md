# License Cache Issue Fix

## Problem

You're seeing "License Expired" with message "License information not available" even though the database has 365 days of license.

### Root Cause

**Redis Cache Issue**: The client data was cached BEFORE the license field was added to the database schema. The cached data doesn't include the `license` field, so when the mobile app fetches client data, it gets old cached data without license information.

## Evidence

From your screenshot:
- Error: "License information not available. Please contact support."
- License Status shows: "No License Data"
- This means `clientData.license === null || clientData.license === undefined`

## Solution

### 1. Mobile App Fix (profile.tsx)

Added cache-busting to force fresh data:

```typescript
const fetchClientData = async (clientId: string) => {
    // Add timestamp to bypass cache
    const timestamp = new Date().getTime();
    const response = await axios.get(`${domain}/api/clients?id=${clientId}&_t=${timestamp}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
    
    // Better license field handling
    let licenseValue = null;
    if (client.license !== undefined && client.license !== null) {
        licenseValue = client.license;
    } else {
        console.warn('⚠️ License field missing - possible cache issue');
        licenseValue = null;
    }
    
    // ... rest of code
};
```

### 2. Backend Cache Clear API

Created new endpoint: `/api/clients/clear-cache`

**Clear specific client cache:**
```bash
POST /api/clients/clear-cache
{
  "clientId": "your-client-id-here"
}
```

**Clear all clients cache:**
```bash
POST /api/clients/clear-cache
{
  "clearAll": true
}
```

**Check cache status:**
```bash
GET /api/clients/clear-cache?clientId=your-client-id-here
```

## How to Fix Your Current Issue

### Option 1: Clear Cache via API (Recommended)

Use Postman or curl to clear the cache:

```bash
curl -X POST http://your-api-domain/api/clients/clear-cache \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

### Option 2: Restart Redis

If you have access to Redis:

```bash
redis-cli FLUSHDB
```

### Option 3: Wait for Cache Expiry

The cache expires after 24 hours (86400 seconds). You can wait, but this is not ideal.

### Option 4: Force Refresh in App

The mobile app now includes cache-busting, so:
1. Close the app completely
2. Clear app data/cache (if possible)
3. Reopen the app
4. Pull to refresh on the profile page

## Verification Steps

1. **Check if client is cached:**
   ```bash
   GET /api/clients/clear-cache?clientId=YOUR_CLIENT_ID
   ```
   
   Response will show:
   ```json
   {
     "success": true,
     "data": {
       "isCached": true/false,
       "hasLicenseField": true/false,
       "licenseValue": 365 or null
     }
   }
   ```

2. **Clear the cache:**
   ```bash
   POST /api/clients/clear-cache
   {
     "clientId": "YOUR_CLIENT_ID"
   }
   ```

3. **Verify in mobile app:**
   - Open profile page
   - Pull to refresh
   - Should now show "365 days left" instead of "No License Data"

## Console Logs to Check

When you open the profile page, check the console for:

```
🔍 Fetching client data for ID: [your-client-id]
🔍 Client API response data: {...}
✅ Client license value: 365  // Should show your actual license days
✅ Client license type: number
✅ Final license value being set: 365
```

If you see:
```
⚠️ License field missing but isLicenseActive is true - possible cache issue
```

This confirms it's a cache problem.

## Prevention

To prevent this in the future:

1. **Always invalidate cache when updating schema:**
   ```typescript
   await client.del(`client:${clientId}`);
   await client.del('clients:all');
   ```

2. **Use shorter cache TTL for frequently changing data:**
   ```typescript
   // Instead of 24 hours (86400)
   await client.set(`client:${id}`, JSON.stringify(data), 'EX', 3600); // 1 hour
   ```

3. **Include version in cache key:**
   ```typescript
   const CACHE_VERSION = 'v2'; // Increment when schema changes
   await client.set(`client:${CACHE_VERSION}:${id}`, data);
   ```

## Testing

After applying the fix:

1. ✅ License = 365 → Should show "365 days left" (blue badge)
2. ✅ License = 5 → Should show "5 days left" (orange warning)
3. ✅ License = 0 → Should show "License Expired" (red badge)
4. ✅ License = -1 → Should show "Lifetime Access" (green badge)
5. ✅ License = null → Should show "No License Data" (gray badge)

## Quick Fix Command

Run this to clear all client caches immediately:

```bash
curl -X POST http://localhost:3000/api/clients/clear-cache \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

Then refresh your mobile app.
