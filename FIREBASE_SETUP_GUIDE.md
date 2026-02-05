# 🔥 Firebase Setup Guide for Push Notifications

## Current Issue
Your test results show: `Default FirebaseApp is not initialized in this process com.codewithrushi.xsite`

This means Firebase is not properly configured for your Android app.

## ✅ What I've Already Done

1. **Updated app.json** - Added Firebase configuration paths
2. **Created placeholder Firebase files** - `google-services.json` and `GoogleService-Info.plist`
3. **Updated EAS configuration** - Optimized for development builds

## 🚀 Next Steps (You Need to Do This)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `xsite-push-notifications` (or any name you prefer)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Android App to Firebase

1. In your Firebase project, click "Add app" → Android icon
2. Enter these details:
   - **Android package name**: `com.codewithrushi.xsite`
   - **App nickname**: `Xsite Android`
   - **Debug signing certificate SHA-1**: (optional for now)
3. Click "Register app"

### Step 3: Download Real Configuration Files

1. **Download `google-services.json`**:
   - Firebase will provide this file
   - Replace the placeholder file I created: `Xsite/google-services.json`

2. **Add iOS App** (if you plan to support iOS):
   - Click "Add app" → iOS icon
   - Enter bundle ID: `com.codewithrushi.xsite`
   - Download `GoogleService-Info.plist`
   - Replace the placeholder file I created: `Xsite/GoogleService-Info.plist`

### Step 4: Enable Cloud Messaging

1. In Firebase Console, go to "Project Settings" → "Cloud Messaging"
2. Note down your **Server Key** and **Sender ID**
3. These will be used by your backend to send notifications

### Step 5: Rebuild Your App

After replacing the Firebase configuration files:

```bash
# Clear cache and rebuild
npx expo install --fix
eas build --profile development --platform android
```

## 🔧 Alternative Quick Fix (For Testing Only)

If you want to test immediately without setting up Firebase, you can use Expo's push notification service:

### Update your push token service to use Expo notifications:

```typescript
// In your pushTokenService.ts, modify the token generation:
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f', // Your Expo project ID
});
```

This should work with your current setup without Firebase.

## 📱 Testing After Setup

1. Run your test button again
2. The "Token Generation" test should now pass
3. You should be able to register push tokens successfully
4. Test notifications should work

## 🆘 If You Still Have Issues

1. **Check package name**: Make sure `com.codewithrushi.xsite` matches exactly in:
   - `app.json` → `android.package`
   - Firebase project settings
   - `google-services.json` → `client.client_info.android_client_info.package_name`

2. **Verify file placement**: 
   - `google-services.json` should be in the root directory (`Xsite/google-services.json`)
   - `GoogleService-Info.plist` should be in the root directory (`Xsite/GoogleService-Info.plist`)

3. **Clean rebuild**:
   ```bash
   npx expo install --fix
   rm -rf node_modules
   npm install
   eas build --profile development --platform android --clear-cache
   ```

## 🎯 Expected Result

After proper Firebase setup, your test should show:
- ✅ Token Generation: Push token generated successfully
- ✅ API Registration: Token registered successfully with backend
- ✅ Notification Send: Test notification sent successfully

The current placeholder files I created will allow the app to build, but you need real Firebase credentials for push notifications to work properly.