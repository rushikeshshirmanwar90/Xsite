# Material Notifications & APK Build Guide

## 📱 Material Notification System

### Overview
The notification system triggers when materials are added (imported) or used in projects. It shows:
- ✅ Toast notifications (in-app)
- ✅ Activity feed updates
- ✅ Optional email/push notifications (backend integration)

### How to Use

#### 1. Import the Hook
```typescript
import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';
```

#### 2. Use in Your Component
```typescript
const { 
    showMaterialAddedNotification,
    showMaterialUsedNotification,
    showBatchMaterialAddedNotification,
    showBatchMaterialUsedNotification 
} = useMaterialNotifications();
```

#### 3. Trigger Notifications

**When Adding Single Material:**
```typescript
showMaterialAddedNotification({
    materialName: 'Cement',
    quantity: 50,
    unit: 'bags',
    projectName: 'Building A',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    clientId: 'client123',
    companyName: 'ABC Construction'
});
```

**When Using Single Material:**
```typescript
showMaterialUsedNotification({
    materialName: 'Steel Rods',
    quantity: 100,
    unit: 'kg',
    projectName: 'Building A',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    clientId: 'client123',
    companyName: 'ABC Construction'
});
```

**When Adding Multiple Materials (Batch):**
```typescript
showBatchMaterialAddedNotification(
    [
        { name: 'Cement', qnt: 50, unit: 'bags' },
        { name: 'Sand', qnt: 100, unit: 'kg' },
        { name: 'Bricks', qnt: 500, unit: 'pieces' }
    ],
    'Building A'
);
```

**When Using Multiple Materials (Batch):**
```typescript
showBatchMaterialUsedNotification(
    [
        { name: 'Cement', qnt: 10, unit: 'bags' },
        { name: 'Sand', qnt: 20, unit: 'kg' }
    ],
    'Building A'
);
```

### Integration Points

#### A. Material Import Modal
File: `Xsite/components/notification/MaterialImportModal.tsx`

Add after successful import (in the `onImport` callback):
```typescript
// After successful API call
showBatchMaterialAddedNotification(
    materialsWithCosts.map(m => ({ name: m.name, qnt: m.qnt, unit: m.unit })),
    projectName
);
```

#### B. Material Usage (Details Page)
File: `Xsite/app/details.tsx`

Add after successful material usage API call (around line 1076):
```typescript
// After successful batch usage
showBatchMaterialUsedNotification(
    apiPayload.materials.map(m => ({ name: m.name, qnt: m.qnt, unit: m.unit })),
    projectName
);
```

#### C. Add Stock Modal
File: `Xsite/components/details/AddStockModal.tsx`

Add after successful stock addition:
```typescript
showMaterialAddedNotification({
    materialName: formData.name,
    quantity: parseFloat(formData.quantity),
    unit: formData.unit,
    projectName: projectName,
    userName: currentUser.fullName,
    userEmail: currentUser.email,
    clientId: clientId,
    companyName: companyName
});
```

### Viewing Notifications

Users can view all material activities in:
1. **Notification Tab** - `/notification` route
2. **Material Activity Modal** - Available in project details

---

## 📦 Building APK/AAB File

### Prerequisites

1. **Install EAS CLI** (if not already installed):
```bash
npm install -g eas-cli
```

2. **Login to Expo Account**:
```bash
eas login
```

3. **Configure EAS Build** (already done in your project):
Your `eas.json` is already configured!

### Build Commands

#### Option 1: Build APK (For Testing/Distribution)
```bash
cd Xsite
eas build -p android --profile preview
```

This creates an APK file that you can:
- Install directly on Android devices
- Share via email/drive
- Test without Play Store

#### Option 2: Build AAB (For Play Store)
```bash
cd Xsite
eas build -p android --profile production
```

This creates an AAB (Android App Bundle) for:
- Google Play Store submission
- Optimized app size
- Better performance

#### Option 3: Build for Development
```bash
cd Xsite
eas build -p android --profile development
```

### Build Process

1. **Start Build**:
```bash
cd Xsite
eas build -p android --profile preview
```

2. **Wait for Build** (takes 10-20 minutes):
   - EAS will upload your code
   - Build on Expo servers
   - Generate the APK/AAB file

3. **Download Build**:
   - Check build status: `eas build:list`
   - Download link will be provided in terminal
   - Or visit: https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds

4. **Install APK**:
   - Download APK to your phone
   - Enable "Install from Unknown Sources"
   - Install the APK

### Build Profiles Explained

Your `eas.json` has 3 profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"  // ← Use this for APK
    },
    "production": {
      "autoIncrement": true"      // ← Use this for Play Store
    }
  }
}
```

### Troubleshooting Build Issues

#### Issue: "No Android project found"
**Solution**: Your Android folder exists, so this shouldn't happen. If it does:
```bash
cd Xsite
npx expo prebuild --platform android
```

#### Issue: "Build failed - Gradle error"
**Solution**: Check your `android/app/build.gradle` for version conflicts

#### Issue: "Keystore not found"
**Solution**: EAS automatically manages keystores. For first build:
```bash
eas build:configure
```

#### Issue: "Build takes too long"
**Solution**: This is normal. First build takes 15-20 minutes.

### Checking Build Status

```bash
# List all builds
eas build:list

# Check specific build
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]
```

### Local Build (Alternative)

If you want to build locally instead of using EAS:

```bash
cd Xsite/android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 Quick Start Commands

### For Notifications:
```bash
# Already implemented! Just use the hook in your components
# See integration points above
```

### For APK Build:
```bash
# 1. Navigate to project
cd Xsite

# 2. Login to EAS (first time only)
eas login

# 3. Build APK
eas build -p android --profile preview

# 4. Wait and download from the link provided
```

### For AAB Build (Play Store):
```bash
cd Xsite
eas build -p android --profile production
```

---

## 📝 Next Steps

### 1. Integrate Notifications
- [ ] Add notification hook to MaterialImportModal
- [ ] Add notification hook to details.tsx (material usage)
- [ ] Add notification hook to AddStockModal
- [ ] Test notifications in app

### 2. Build APK
- [ ] Run `eas build -p android --profile preview`
- [ ] Wait for build to complete
- [ ] Download and test APK
- [ ] Share with team/testers

### 3. Optional Enhancements
- [ ] Add push notifications (using Expo Notifications)
- [ ] Add email notifications (backend integration)
- [ ] Add notification preferences (user settings)
- [ ] Add notification sound/vibration

---

## 🔗 Useful Links

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Your Expo Dashboard**: https://expo.dev/accounts/codewithrushi/projects/site_Ex
- **Build Status**: https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds
- **Expo Notifications**: https://docs.expo.dev/push-notifications/overview/

---

## 💡 Tips

1. **First Build**: Takes longer (15-20 min). Subsequent builds are faster.
2. **APK Size**: Preview builds are larger. Production builds are optimized.
3. **Testing**: Use preview profile for testing, production for Play Store.
4. **Notifications**: Test on real device, not simulator.
5. **Build Credits**: Free tier has limited builds. Upgrade if needed.

---

## ❓ Need Help?

If you encounter issues:
1. Check build logs: `eas build:view [BUILD_ID]`
2. Check Expo status: https://status.expo.dev/
3. Review error messages carefully
4. Check your `app.json` and `eas.json` configuration
