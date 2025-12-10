# Notification Screen Debug Guide

## Current Status

✅ **Task 2 COMPLETE**: Activity API is successfully being called when adding projects

- Activities are being saved to the database
- Direct axios.post() calls are working in `app/(tabs)/add-project.tsx`

🔄 **Task 3 IN PROGRESS**: Activities not displaying in notification screen

- Activities exist in database but not showing in UI
- Need to verify API response format

## What's Been Fixed

The notification screen (`app/notification.tsx`) already has:

1. ✅ **Array Safety Checks**

   - `Array.isArray()` checks before forEach/map
   - Fallback to empty arrays: `setActivities(activities || [])`
   - Safe iteration in `getCombinedActivities()` and `getFilteredActivities()`

2. ✅ **Multiple Response Format Handling**

   ```typescript
   // Handles these formats:
   // - Direct array: [activity1, activity2, ...]
   // - Wrapped: { activities: [...] }
   // - Wrapped: { data: [...] }
   // - Wrapped: { activity: [...] }
   ```

3. ✅ **Comprehensive Logging**

   - Logs full API response structure
   - Shows activity counts
   - Warns when no activities found
   - Debug button in header (bug icon)

4. ✅ **Error Handling**
   - Try-catch blocks around API calls
   - Graceful fallbacks on errors
   - User-friendly error messages

## Next Steps: Debug the Issue

### Step 1: Open Notification Screen

1. Run your app
2. Navigate to the notification screen
3. **Keep the console/terminal open** to see logs

### Step 2: Check Console Logs

Look for these log messages in your console:

```
========================================
FETCHING ACTIVITIES
========================================
Client ID: [your-client-id]
API URLs:
  - Activity: http://10.127.223.135:8080/api/activity?clientId=...
  - Material Activity: http://10.127.223.135:8080/api/materialActivity?clientId=...

--- API RESPONSES ---
Activity Response: { ... }
Material Activity Response: { ... }

--- EXTRACTED DATA ---
Activities count: X
Material Activities count: Y
```

### Step 3: Analyze the Response

**If you see "Activities count: 0":**

- Check if the API is returning data in an unexpected format
- Look at the "Activity Response" log to see the exact structure
- The response might be wrapped differently than expected

**If you see "Activities count: X" (where X > 0):**

- Activities are being fetched correctly
- The issue might be in rendering
- Check if there are any React errors in the console

### Step 4: Use the Debug Button

In the notification screen header, there's a **bug icon** (🐛). Tap it to see:

- Current activity counts
- Active tab
- Filtered activities count
- Loading state
- Any errors

## Common Issues & Solutions

### Issue 1: API Returns Different Format

**Symptom**: "Activities count: 0" but you know activities exist

**Solution**: Check the API response format in console logs. The backend might return:

```typescript
// Expected formats (already handled):
{ activities: [...] }
{ data: [...] }
{ activity: [...] }
[...] // direct array

// If it's different, we need to update the parsing logic
```

### Issue 2: Wrong Client ID

**Symptom**: API returns empty array or error

**Solution**: Verify the clientId in AsyncStorage matches the one used when creating projects

### Issue 3: API Endpoint Not Responding

**Symptom**: Network error or timeout

**Solution**:

- Check if backend server is running
- Verify domain in `lib/domain.ts`: `http://10.127.223.135:8080`
- Test API directly with the test script (see below)

## Test Scripts

### Option 1: Test in App (Recommended)

1. Open notification screen
2. Pull down to refresh
3. Check console logs
4. Tap debug button (bug icon)

### Option 2: Test API Directly

Use the provided test script:

```bash
# 1. Edit TEST_NOTIFICATION_API.tsx
# 2. Replace YOUR_CLIENT_ID with your actual clientId
# 3. Run:
npx ts-node TEST_NOTIFICATION_API.tsx
```

This will show you the exact API response format.

## What to Share for Further Help

If activities still don't show, please share:

1. **Console logs** from the notification screen (especially the "API RESPONSES" section)
2. **Debug button output** (tap the bug icon)
3. **Any error messages** you see
4. **Screenshot** of the notification screen

## Code References

- **Notification Screen**: `app/notification.tsx`
- **Working Activity API Call**: `app/(tabs)/add-project.tsx` (line ~200-280)
- **Activity Logger Utils**: `utils/activityLogger.ts`
- **Domain Config**: `lib/domain.ts`

## Expected Behavior

Once working, you should see:

- Activities grouped by date (Today, Yesterday, etc.)
- Project activities (created, updated, deleted)
- Material activities (imported, used)
- User avatars and timestamps
- Pull-to-refresh functionality
- Tab filtering (All, Projects, Materials)

---

**Remember**: The activity API is working (Task 2 ✅). We just need to verify the response format matches what the notification screen expects.
