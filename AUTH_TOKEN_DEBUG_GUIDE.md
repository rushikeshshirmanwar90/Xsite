# 🔍 Auth Token Debug Guide

## 🚨 **Issue**: "Failed to register token with backend"

**Root Cause**: The backend now requires authentication (security fix), but the client doesn't have a valid auth token stored.

---

## 🔧 **Fixes Applied**

### 1. **Enhanced Token Detection** ✅
Updated `secureNotificationService.ts` to check multiple auth token keys:
- `auth_token`
- `userToken` 
- `accessToken`
- `authToken`
- `token`

### 2. **Graceful Failure Handling** ✅
- Service no longer fails completely if backend registration fails
- Local notifications still work even without backend registration
- Better error logging with detailed HTTP status codes

### 3. **Debug Tools Created** ✅
- **AuthTokenDebugger Component**: Shows all stored tokens and user data
- **Debug Page**: `/debug-auth-tokens` - accessible via bug icon in header
- **Enhanced Logging**: More detailed error messages in console

---

## 🧪 **How to Debug**

### **Step 1: Access Debug Tools**
1. **Via Button**: Tap the bug icon (🐛) in the app header
2. **Via Navigation**: Navigate to `/debug-auth-tokens`
3. **Via Router**: `router.push('/debug-auth-tokens')`

### **Step 2: Check Token Status**
The debug page will show:
- ✅ **Green checkmark**: Token found
- ❌ **Red X**: Token missing
- **Preview**: First 30 characters of each token
- **Length**: Total character count

### **Step 3: Analyze Results**

#### **Scenario A: No Auth Tokens Found**
```
❌ auth_token: Not found
❌ userToken: Not found  
❌ accessToken: Not found
```
**Solution**: User needs to log in again

#### **Scenario B: User Data Exists, No Tokens**
```
✅ User in AuthContext: Yes
❌ All token keys: Not found
```
**Solution**: Check login flow - tokens not being stored after login

#### **Scenario C: Some Tokens Found**
```
✅ userToken: abc123... (156 chars)
❌ auth_token: Not found
```
**Solution**: Service will use the found token

---

## 🔧 **Temporary Solutions**

### **Option 1: Skip Backend Registration (Current)**
- Local notifications work
- Push notifications from server won't work
- Good for development/testing

### **Option 2: Re-login**
1. Logout from the app
2. Login again
3. Check if auth tokens are stored properly

### **Option 3: Manual Token Storage** (Development Only)
```typescript
// Add this temporarily in your login success handler
await AsyncStorage.setItem('auth_token', 'your-jwt-token-here');
```

---

## 🚀 **Production Fix**

### **Root Cause**: Login Flow Not Storing Auth Tokens

**Check your login implementation:**

1. **After successful login**, ensure you store the auth token:
```typescript
// In your login success handler
const response = await loginAPI(credentials);
if (response.success) {
  // Store the auth token
  await AsyncStorage.setItem('auth_token', response.token);
  // Or whatever key your backend returns
}
```

2. **Common token response formats:**
```typescript
// Format 1: Direct token
{ success: true, token: "jwt-token-here" }

// Format 2: Nested in data
{ success: true, data: { token: "jwt-token-here" } }

// Format 3: Different key names
{ success: true, accessToken: "jwt-token-here" }
{ success: true, authToken: "jwt-token-here" }
```

3. **Update your login flow** to store the token in AsyncStorage

---

## 📊 **Debug Console Output**

When the service runs, you'll see:
```
🔍 DEBUG: Checking authentication status...
✅ Found token at key 'userToken': abc123def456...
👤 User data found: { id: "...", email: "...", hasToken: false }
⚠️ Failed to register token with backend - continuing with local notifications only
📱 Local notifications will still work, but push notifications from server may not
✅ Secure notification service initialized successfully
```

---

## 🎯 **Next Steps**

1. **Use Debug Tools**: Check what tokens are stored
2. **Fix Login Flow**: Ensure auth tokens are stored after login
3. **Test Backend**: Once tokens are stored, backend registration should work
4. **Remove Debug Tools**: Remove debug buttons/pages before production

---

## 🔒 **Security Notes**

- Debug tools show token previews (first 30 chars) for security
- Never log full tokens in production
- Clear debug tools before production deployment
- Auth tokens should be JWT format for the backend security middleware

---

**🎯 The notification system will work locally even with this error. The main issue is push notifications from your server won't work until auth tokens are properly stored.**