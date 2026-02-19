# 📱 Xsite App Branding Setup Guide

## 🎯 **Goal**
Show "Xsite" instead of "Expo Go" and use your custom app icon for notifications.

## ⚠️ **Important Note**
The app name and icon will only show correctly in:
- **Development Build** (EAS Development Build)
- **Production Build** (APK/AAB)
- **NOT in Expo Go** (Expo Go always shows "Expo Go" as the app name)

## 🔧 **What I've Updated**

### 1. **app.json Configuration**
✅ **Enhanced notification settings:**
- Custom notification channels for better organization
- Proper app branding configuration
- Android adaptive icon setup
- iOS notification settings

### 2. **SimpleNotificationService.ts**
✅ **Improved notification channels:**
- `default` - General notifications
- `project-updates` - Material, labor, and project activities

### 3. **Backend API**
✅ **Enhanced notification payload:**
- Uses `project-updates` channel
- Proper priority and badge settings
- Category identification

## 🚀 **How to Build and Test**

### **Option 1: Development Build (Recommended for Testing)**
```bash
# Install EAS CLI if you haven't
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build development version
eas build --profile development --platform android

# Install the APK on your device
# The app will show "Xsite" name and your custom icon
```

### **Option 2: Preview Build (For Sharing)**
```bash
# Build preview version (internal distribution)
eas build --profile preview --platform android
```

### **Option 3: Production Build**
```bash
# Build production version
eas build --profile production --platform android
```

## 📱 **Expected Results After Building**

### **Before (Expo Go):**
```
🔔 Notification from "Expo Go"
   📦 Material Added by Staff Name
   Tmp: Added 1 material worth ₹1,400
```

### **After (Built App):**
```
🔔 Notification from "Xsite" 
   📦 Material Added by Staff Name
   Added 1 material worth ₹1,400
```

## 🎨 **Notification Channels**

Your app now has two notification channels:

1. **Default Notifications**
   - General app notifications
   - Blue accent color (#3B82F6)

2. **Project Updates** 
   - Material additions
   - Labor cost updates
   - Usage tracking
   - Green accent color (#10B981)

## 🔍 **Testing Checklist**

After building the app:

1. ✅ Install the built APK (not Expo Go)
2. ✅ Add a material in the details page
3. ✅ Check notification shows "Xsite" as sender
4. ✅ Verify custom app icon appears
5. ✅ Confirm clean message format (no "Tmp")

## 📝 **Build Commands Summary**

```bash
# Quick development build
eas build --profile development --platform android --local

# Or cloud build (recommended)
eas build --profile development --platform android
```

## 🎯 **Next Steps**

1. Run the build command above
2. Install the generated APK on your device
3. Test the notification system
4. You should see "Xsite" instead of "Expo Go"!

The notification system is fully configured and ready - you just need to build the app to see the proper branding! 🎉