# 🚨 CRITICAL: Axios Bearer Token Issue in Xsite App

## The Problem

The Xsite mobile app has **TWO ways** of making API calls:

1. ✅ **`apiClient`** from `utils/axiosConfig.ts` - **INCLUDES bearer token**
2. ❌ **Plain `axios`** - **DOES NOT include bearer token**

Many files are using plain `axios` instead of `apiClient`, which means they're NOT sending the bearer token and getting 401 errors!

## Root Cause

When you import:
```typescript
import axios from 'axios';  // ❌ WRONG - No bearer token
```

Instead of:
```typescript
import apiClient from '@/utils/axiosConfig';  // ✅ CORRECT - Includes bearer token
```

The requests don't include the `Authorization: Bearer ...` header, causing 401 Unauthorized errors.

## Files That Need Fixing

### ✅ FIXED
- `hooks/useLicenseCheck.ts` - Now uses `apiClient`

### ❌ NEEDS FIXING (High Priority)
These files make API calls and need to be updated:

1. **hooks/useUnifiedActivities.ts** - Activity tracking
2. **hooks/useUser.ts** - User data fetching
3. **contexts/AuthContext.tsx** - Authentication
4. **services/pushTokenService.ts** - Push notifications
5. **services/secureNotificationService.ts** - Notifications
6. **services/notificationService.ts** - Notifications
7. **app/(tabs)/dashboard.tsx** - Dashboard data
8. **app/(tabs)/profile.tsx** - Profile data
9. **app/(tabs)/staff.tsx** - Staff management
10. **app/(tabs)/add-project.tsx** - Project creation
11. **app/details.tsx** - Project details
12. **app/project-sections.tsx** - Section management
13. **app/equipment.tsx** - Equipment management
14. **app/notification.tsx** - Notifications
15. **components/ProjectCard.tsx** - Project operations
16. **components/details/MaterialUsageForm.tsx** - Material tracking
17. **components/details/LaborPageModal.tsx** - Labor management
18. **components/client/ClientStaffsManager.tsx** - Staff assignment
19. **components/staff/ManualStaffAssignModal.tsx** - Staff operations
20. **components/staff/StaffQRScannerModal.tsx** - QR scanning

And **30+ more files**...

## The Fix

For each file, change:

### Before (❌ Wrong):
```typescript
import axios from 'axios';
import { domain } from '@/lib/domain';

// Later in code:
const response = await axios.get(`${domain}/api/clients?id=${id}`);
```

### After (✅ Correct):
```typescript
import apiClient from '@/utils/axiosConfig';

// Later in code:
const response = await apiClient.get(`/api/clients?id=${id}`);
// Note: No need for ${domain} - apiClient already has baseURL configured
```

## Quick Fix Script

I'll create a script to help identify and fix these issues automatically.

## Why This Happened

The `axiosConfig.ts` file was created to centralize bearer token configuration, but:
1. Many files were written before `axiosConfig.ts` existed
2. Developers continued using plain `axios` out of habit
3. No linting rule enforced using `apiClient`

## Impact

**Every API call using plain `axios` will fail with 401 Unauthorized** because:
- Backend now requires bearer token authentication (after our migration)
- Plain `axios` doesn't send the bearer token
- Only `apiClient` sends the bearer token

## Immediate Action Required

1. ✅ **DONE**: Fixed `hooks/useLicenseCheck.ts`
2. 🔄 **TODO**: Fix all other files listed above
3. 🔄 **TODO**: Add ESLint rule to prevent plain `axios` imports

## Testing After Fix

After fixing a file, test that feature in the app:
- License check should work ✅
- Dashboard should load data
- Profile should load
- Projects should load
- etc.

## Long-term Solution

1. Create ESLint rule:
```json
{
  "no-restricted-imports": ["error", {
    "paths": [{
      "name": "axios",
      "message": "Use apiClient from @/utils/axiosConfig instead"
    }]
  }]
}
```

2. Add to `.eslintrc.js` to prevent future issues

---

**Status**: 1 file fixed, 40+ files remaining
