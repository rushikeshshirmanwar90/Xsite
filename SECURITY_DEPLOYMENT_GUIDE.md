# 🔐 Security Deployment Guide

## ✅ Current Status

**Local Security Implementation**: ✅ **COMPLETE**
- Token encryption: Working
- Input validation: All tests passed (4/4)
- Input sanitization: Working
- Authentication middleware: Implemented
- Rate limiting: Implemented

**Production Deployment**: ⏳ **PENDING**

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

Add these environment variables to your production environment (Vercel, Netlify, etc.):

```bash
# Required for JWT authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Required for token encryption
ENCRYPTION_KEY=your-encryption-key-for-tokens-32-chars

# Database connection (if not already set)
MONGODB_URI=your-mongodb-connection-string
```

**⚠️ IMPORTANT**: Use strong, unique values for production!

#### For Vercel Deployment:

1. Go to your Vercel dashboard
2. Select your `real-estate-apis` project
3. Go to Settings → Environment Variables
4. Add the variables above

#### Generate Secure Keys:

```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Deploy Updated API Route

The security-enhanced API route is ready in:
```
real-estate-apis/app/api/push-token/route.ts
```

**Deploy to production:**

```bash
cd real-estate-apis
npm run build
npm run deploy  # or your deployment command
```

**For Vercel:**
```bash
cd real-estate-apis
vercel --prod
```

### Step 3: Encrypt Existing Tokens

After deployment, run the migration script to encrypt existing tokens:

```bash
cd Xsite
DB_TYPE=mongodb ENCRYPTION_KEY=your-encryption-key node encrypt-existing-tokens-migration.js
```

### Step 4: Verify Deployment

Run the comprehensive test suite:

```bash
cd Xsite
API_BASE_URL=https://your-production-api.com node test-notification-system-complete.js
```

**Expected Results After Deployment:**
- ✅ No Auth Token Rejection: Should pass (401 status)
- ✅ Invalid Auth Token Rejection: Should pass (403 status)
- ✅ Input Validation: All malicious inputs should be rejected (400 status)
- ✅ Rate Limiting: Should trigger after 10 requests (429 status)

---

## 🔧 Security Features Implemented

### 1. **JWT Authentication** ✅
- All endpoints require valid JWT token
- Token verification with configurable secret
- User authorization (users can only access their own data)

### 2. **Input Validation** ✅
- MongoDB ObjectId format validation for userId
- Expo push token format validation
- Platform restriction (ios/android only)
- User type validation (admin/staff/client)
- Device ID length validation
- App version format validation (x.y.z)

### 3. **Input Sanitization** ✅
- HTML tag removal
- JavaScript injection prevention
- Event handler removal
- Data URL blocking

### 4. **Rate Limiting** ✅
- 10 requests per 15-minute window per IP
- Automatic cleanup of expired entries
- Configurable limits

### 5. **Token Encryption** ✅
- AES-256-CBC encryption for stored tokens
- Configurable encryption key
- Secure token handling

### 6. **Security Logging** ✅
- All security events logged
- Failed authentication attempts tracked
- Rate limit violations logged
- Input validation failures recorded

---

## 🧪 Testing Your Deployment

### Manual Testing Commands:

1. **Test No Authentication (should fail):**
```bash
curl -X POST https://your-api.com/api/push-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"676b0b4b4c8c5b4d8e9f1234","token":"ExponentPushToken[test]","platform":"ios","userType":"client","deviceId":"test"}'
```
Expected: `401 Unauthorized`

2. **Test Invalid Token (should fail):**
```bash
curl -X POST https://your-api.com/api/push-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"userId":"676b0b4b4c8c5b4d8e9f1234","token":"ExponentPushToken[test]","platform":"ios","userType":"client","deviceId":"test"}'
```
Expected: `403 Forbidden`

3. **Test Malicious Input (should fail):**
```bash
curl -X POST https://your-api.com/api/push-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer valid-jwt-token" \
  -d '{"userId":"<script>alert(1)</script>","token":"invalid","platform":"windows","userType":"hacker","deviceId":"test"}'
```
Expected: `400 Bad Request` with validation errors

### Automated Testing:

```bash
# Run full test suite
cd Xsite
node test-notification-system-complete.js

# Expected results after deployment:
# ✅ Passed: 22+
# ❌ Failed: 0-2
# 📈 Success Rate: 90%+
```

---

## 🚨 Security Checklist

Before going to production, verify:

- [ ] Environment variables set with strong values
- [ ] API route deployed with security middleware
- [ ] Existing tokens encrypted in database
- [ ] All tests passing (90%+ success rate)
- [ ] Rate limiting working (429 after 10 requests)
- [ ] Authentication required (401 without token)
- [ ] Input validation blocking malicious data
- [ ] Security logging enabled

---

## 🔍 Monitoring & Maintenance

### Security Logs to Monitor:

```bash
# Look for these in your logs:
🔐 SECURITY LOG [WARN]: Authentication failed
🔐 SECURITY LOG [WARN]: Rate limit exceeded
🔐 SECURITY LOG [WARN]: Input validation failed
🔐 SECURITY LOG [ERROR]: User attempted to access another user's data
```

### Regular Security Tasks:

1. **Weekly**: Review security logs for suspicious activity
2. **Monthly**: Rotate JWT_SECRET and ENCRYPTION_KEY
3. **Quarterly**: Run full security test suite
4. **Annually**: Security audit and penetration testing

---

## 🆘 Troubleshooting

### Common Issues:

**1. Tests still failing after deployment**
- Check environment variables are set correctly
- Verify API route is deployed (check build logs)
- Ensure JWT_SECRET matches between client and server

**2. Rate limiting not working**
- Check if multiple server instances are running
- Consider using Redis for distributed rate limiting

**3. Token encryption errors**
- Verify ENCRYPTION_KEY is exactly 32 characters
- Check existing tokens are properly migrated

**4. Authentication failures**
- Verify JWT token format and expiration
- Check JWT_SECRET is consistent
- Ensure Authorization header format: `Bearer <token>`

---

## 📞 Next Steps

1. **Deploy Now**: Follow steps 1-4 above
2. **Test Thoroughly**: Run all test suites
3. **Monitor**: Watch security logs for first 24 hours
4. **Document**: Update your team on new security requirements

**Estimated Deployment Time**: 30-60 minutes

**🎯 Goal**: Achieve 100% test pass rate before production release!