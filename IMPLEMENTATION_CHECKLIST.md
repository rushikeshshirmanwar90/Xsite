# ✅ Implementation Checklist

## Part 1: Material Notification System

### Step 1: Files Already Created ✅
- [x] `Xsite/services/notificationService.ts` - Enhanced with material notifications
- [x] `Xsite/hooks/useMaterialNotifications.ts` - Custom hook for notifications
- [x] `Xsite/components/notifications/MaterialActivityNotifications.tsx` - Already exists

### Step 2: Integrate Notifications in Components

#### A. Material Import Modal
**File**: `Xsite/components/notification/MaterialImportModal.tsx`

**What to add**:
```typescript
// At the top with other imports
import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';

// Inside component, after other hooks
const { showBatchMaterialAddedNotification } = useMaterialNotifications();

// In handleImportAll, after onImport(apiPayload) call
showBatchMaterialAddedNotification(
    apiPayload.materials.map(m => ({
        name: m.name,
        qnt: m.qnt,
        unit: m.unit
    })),
    sectionName
);
```

**Where to add**: After line 130 (after `onImport(apiPayload);`)

---

#### B. Material Usage (Details Page)
**File**: `Xsite/app/details.tsx`

**What to add**:
```typescript
// At the top with other imports
import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';

// Inside component, after other hooks
const { showBatchMaterialUsedNotification } = useMaterialNotifications();

// After successful material usage API call (around line 1100)
if (responseData.success) {
    showBatchMaterialUsedNotification(
        apiPayload.materials.map(m => ({
            name: m.name,
            qnt: m.qnt,
            unit: m.unit
        })),
        projectName
    );
    // ... rest of success handling
}
```

**Where to add**: After line 1100 (after checking `responseData.success`)

---

#### C. Add Stock Modal
**File**: `Xsite/components/details/AddStockModal.tsx`

**What to add**:
```typescript
// At the top with other imports
import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inside component, after other hooks
const { showMaterialAddedNotification } = useMaterialNotifications();

// After successful stock addition
const handleSubmit = async () => {
    try {
        // ... existing API call ...
        
        if (response.data.success) {
            // Get user data
            const userDetailsString = await AsyncStorage.getItem("user");
            const userData = userDetailsString ? JSON.parse(userDetailsString) : null;
            
            if (userData) {
                showMaterialAddedNotification({
                    materialName: formData.name,
                    quantity: parseFloat(formData.quantity),
                    unit: formData.unit,
                    projectName: projectName, // You'll need to pass this as prop
                    userName: `${userData.firstName} ${userData.lastName}`,
                    userEmail: userData.email,
                    clientId: userData.clientId,
                    companyName: userData.companyName || 'Your Company'
                });
            }
            
            // ... rest of success handling
        }
    } catch (error) {
        // ... error handling
    }
};
```

---

### Step 3: Test Notifications

1. **Start the app**:
```bash
cd Xsite
npx expo start
```

2. **Test Material Added**:
   - Login to app
   - Go to a project
   - Add material stock
   - You should see: "Material Added" toast notification

3. **Test Material Used**:
   - Go to project details
   - Click on a material
   - Add usage
   - You should see: "Material Used" toast notification

4. **View Activity Feed**:
   - Go to Notification tab
   - See all material activities
   - Filter by "Imported" or "Used"

---

## Part 2: Build APK/AAB File

### Step 1: Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

Enter your credentials:
- Email: (your Expo account email)
- Password: (your Expo password)

### Step 3: Navigate to Project
```bash
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite
```

### Step 4: Build APK
```bash
eas build -p android --profile preview
```

**What happens**:
1. EAS uploads your code
2. Builds on Expo servers
3. Takes 10-20 minutes
4. Provides download link

### Step 5: Download & Install

**Option A: Direct Download**
1. Click the link in terminal
2. Download APK
3. Transfer to Android phone
4. Install

**Option B: QR Code**
1. Scan QR code shown in terminal
2. Download on phone
3. Install

**Option C: Expo Dashboard**
1. Visit: https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds
2. Find your build
3. Download APK
4. Install on phone

### Step 6: Test APK
- Install on Android device
- Test all features
- Test material notifications
- Share with team

---

## Quick Commands Summary

### For Notifications:
```bash
# No commands needed - just integrate the hook in your components
# See Step 2 above for exact code to add
```

### For APK Build:
```bash
# One-time setup
npm install -g eas-cli
eas login

# Build APK
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite
eas build -p android --profile preview

# Check status
eas build:list
```

---

## Verification Checklist

### Notifications ✓
- [ ] Hook imported in MaterialImportModal
- [ ] Hook imported in details.tsx
- [ ] Hook imported in AddStockModal
- [ ] Notification shows when material added
- [ ] Notification shows when material used
- [ ] Activity feed updates
- [ ] Console logs show notification calls

### APK Build ✓
- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Build command executed
- [ ] Build completed successfully
- [ ] APK downloaded
- [ ] APK installed on device
- [ ] App runs correctly
- [ ] All features work

---

## Troubleshooting

### Notifications Not Showing
1. Check if hook is imported correctly
2. Check if toast is configured (sonner-native)
3. Check console for errors
4. Verify API calls are successful

### Build Fails
1. Check build logs: `eas build:view [BUILD_ID]`
2. Verify `app.json` and `eas.json` are correct
3. Check Expo status: https://status.expo.dev/
4. Try: `eas build:configure` then rebuild

### APK Not Installing
1. Enable "Install from Unknown Sources"
2. Check Android version (minimum required)
3. Uninstall old version first
4. Download APK again

---

## Next Steps

1. **Implement Notifications** (30 minutes)
   - Add hook to 3 components
   - Test on device
   - Verify activity feed

2. **Build APK** (20 minutes + build time)
   - Run build command
   - Wait for completion
   - Download and test

3. **Share & Test** (ongoing)
   - Share APK with team
   - Collect feedback
   - Fix issues
   - Rebuild if needed

---

## Support Files Created

1. ✅ `MATERIAL_NOTIFICATIONS_AND_BUILD_GUIDE.md` - Complete guide
2. ✅ `NOTIFICATION_INTEGRATION_EXAMPLE.tsx` - Code examples
3. ✅ `BUILD_APK_COMMANDS.md` - Quick command reference
4. ✅ `IMPLEMENTATION_CHECKLIST.md` - This file

---

## Need Help?

If you get stuck:
1. Check the guide files above
2. Review console logs
3. Check build logs: `eas build:view [BUILD_ID]`
4. Verify all files are saved
5. Restart Expo server if needed

**Ready to start?** Begin with Part 1, Step 2! 🚀
