# 🔧 Complete Notification Troubleshooting Guide

## 🚨 **Problem: Notifications work in test but not when adding materials**

This is a common issue with several possible causes. Here's the complete solution:

## 🔍 **Root Causes & Solutions**

### **1. Token Registration Issues**
**Problem**: Push token not properly registered with backend
**Solution**: Enhanced token validation and retry mechanism

### **2. API Connection Problems**
**Problem**: Backend API calls failing silently
**Solution**: Better error handling and fallback to local notifications

### **3. Device-Specific Issues**
**Problem**: Battery optimization, background restrictions
**Solution**: User guidance and local notification fallbacks

### **4. Permission Problems**
**Problem**: Notification permissions revoked or changed
**Solution**: Permission re-checking and user alerts

## 🛠️ **Implemented Fixes**

### **✅ 1. Enhanced Notification Service**
- Added comprehensive error logging
- Implemented fallback to local notifications
- Better token validation and retry logic
- Increased API timeout from 10s to 15s

### **✅ 2. Improved Backend API**
- Detailed logging for debugging
- Better error responses
- Enhanced recipient validation
- More robust error handling

### **✅ 3. Fallback Mechanism**
- If push notification fails → Local notification
- If API fails → Local notification
- If no token → Local notification
- Always ensure user gets notified

### **✅ 4. Debug Tools**
- Created `NotificationDebugger` component
- Real-time system diagnostics
- Test functions for troubleshooting
- Detailed status information

## 📱 **Testing Steps**

### **Step 1: Add Debug Component**
Add this to your app for testing:

```tsx
import NotificationDebugger from '@/components/NotificationDebugger';

// Add to your app temporarily
<NotificationDebugger />
```

### **Step 2: Run Diagnostics**
1. Open the debugger
2. Check all system status items
3. Run test notifications
4. Check console logs

### **Step 3: Test Material Addition**
1. Add a material in your app
2. Check console logs for detailed output
3. Verify notification received (push or local)

## 🔍 **Console Log Analysis**

When adding material, you should see:

```
📤 Starting notification send process...
📤 Activity data: { projectId: "...", activityType: "material_added", ... }
📤 Notification payload: { projectId: "...", type: "material_added", ... }
📤 Sending to API: https://your-domain.com/api/send-project-notification
📡 API Response status: 200
📡 API Response data: { success: true, data: { sent: 1, ... } }
✅ Successfully sent 1 notifications
```

If you see errors, the system will automatically fall back to local notifications.

## 🎯 **Device-Specific Solutions**

### **Android Battery Optimization**
Some devices aggressively kill background apps:

1. **Xiaomi/MIUI**: Settings → Apps → Manage Apps → [Your App] → Battery Saver → No Restrictions
2. **Huawei**: Settings → Apps → [Your App] → Battery → App Launch → Manage Manually
3. **OnePlus**: Settings → Battery → Battery Optimization → [Your App] → Don't Optimize
4. **Samsung**: Settings → Apps → [Your App] → Battery → Optimize Battery Usage → Off

### **Notification Settings**
Ensure notifications are enabled:
1. Device Settings → Apps → [Your App] → Notifications → Allow
2. Check notification channels are enabled
3. Verify sound settings

## 🚀 **Quick Fix Commands**

```bash
# Clear app data and restart
npx expo start --clear

# Check device logs
adb logcat | grep -i notification

# Test API directly
curl -X POST https://your-domain.com/api/send-project-notification \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","type":"material_added","title":"Test","message":"Test message","recipientType":"admins"}'
```

## 📊 **Success Indicators**

After implementing these fixes, you should see:

1. **✅ Detailed console logs** showing the notification flow
2. **✅ Fallback notifications** if push fails
3. **✅ Better error messages** for debugging
4. **✅ Consistent notification delivery** across devices

## 🎯 **Expected Behavior**

### **Scenario 1: Everything Works**
- Push notification sent successfully
- User receives notification with sound
- Tapping navigates to notification page

### **Scenario 2: Push Fails, Local Works**
- Push notification fails (network/API issue)
- Local notification sent as fallback
- User still gets notified with sound and navigation

### **Scenario 3: Complete Failure**
- Both push and local fail
- Detailed error logs for debugging
- User gets error message in app

## 🔧 **Debug Checklist**

- [ ] User is logged in
- [ ] Notification permissions granted
- [ ] Push token generated successfully
- [ ] API endpoint reachable
- [ ] Backend database connected
- [ ] Recipients found in database
- [ ] Valid push tokens exist
- [ ] Expo push service responding
- [ ] Device not in battery optimization
- [ ] App notifications enabled in device settings

## 📞 **Still Having Issues?**

If notifications still don't work after these fixes:

1. **Check the console logs** - they now provide detailed debugging info
2. **Use the NotificationDebugger** - it shows system status
3. **Test on different devices** - some devices have aggressive power management
4. **Verify backend setup** - ensure database and API are working
5. **Check network connectivity** - API calls might be failing

The enhanced system now provides comprehensive logging and fallbacks to ensure users always get notified, even if the primary push notification system fails.

## 🎉 **Summary**

With these improvements:
- **Better reliability** through fallback mechanisms
- **Enhanced debugging** with detailed logs
- **Device compatibility** with local notification fallbacks
- **User experience** maintained even when push fails
- **Comprehensive testing** tools for troubleshooting

Your notification system is now much more robust and will work across different devices and network conditions!