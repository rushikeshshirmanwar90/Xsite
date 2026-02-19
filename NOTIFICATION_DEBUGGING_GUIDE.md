# 🔧 Notification Debugging Guide

## 🚨 **Common Issues & Solutions**

### **Issue: Notifications work in test but not when adding materials**

This happens because of several potential problems:

## 🔍 **Debugging Steps**

### **1. Check Token Registration**
- Token might not be registered properly
- User authentication issues
- Backend API connection problems

### **2. Check Backend API Response**
- API might be failing silently
- Database connection issues
- Invalid recipient queries

### **3. Check Device-Specific Issues**
- Battery optimization settings
- App background restrictions
- Notification permissions

## 🛠️ **Solutions Implemented**

### **1. Enhanced Error Logging**
- Added detailed console logs
- Better error handling
- Token validation checks

### **2. Retry Mechanism**
- Auto-retry failed notifications
- Fallback to local notifications
- Better user feedback

### **3. Device Compatibility**
- Handle different Android versions
- Battery optimization warnings
- Permission re-checking

## 📱 **Testing Checklist**

1. ✅ Check console logs when adding material
2. ✅ Verify token is registered
3. ✅ Test API endpoint directly
4. ✅ Check device notification settings
5. ✅ Test on different devices

## 🎯 **Quick Fix Commands**

```bash
# Test notification system
npx expo start --clear

# Check logs
adb logcat | grep -i notification
```