# API Testing Guide - With and Without Bearer Token

## 🔧 Testing Setup

### Base URL
```bash
# Production API (recommended)
BASE_URL="https://xsite.tech"

# Local Development (if running locally)
# BASE_URL="http://192.168.102.78:8080"
```

### Bearer Token
```bash
BEARER_TOKEN="eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9."
```

---

## 🚫 **APIs WITHOUT Bearer Token (Should Work)**

These endpoints are intentionally unprotected for authentication/public access:

### 1. Check if User Exists
```bash
curl -X POST https://xsite.tech/api/findUser \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
- `200` - User exists and has password
- `201` - User exists but no password set
- `404` - User not found

### 2. User Login
```bash
curl -X POST https://xsite.tech/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "userType": "client"
  }
}
```

### 3. Send OTP
```bash
curl -X POST https://xsite.tech/api/otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "OTP": 123456
  }'
```

### 4. Set Password (Registration)
```bash
curl -X POST https://xsite.tech/api/password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewPassword123!",
    "userType": "client"
  }'
```

### 5. Forget Password
```bash
curl -X POST https://xsite.tech/api/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "client"
  }'
```

### 6. Public Endpoints
```bash
# Public contact info
curl https://xsite.tech/api/public/contact

# Public marketing info  
curl https://xsite.tech/api/public/marketing

# Public support info
curl https://xsite.tech/api/public/support
```

---

## 🔐 **APIs WITH Bearer Token (Protected)**

These endpoints require Bearer token authentication:

### 1. Get User Data
```bash
curl -X GET "https://xsite.tech/api/clients?email=test@example.com" \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json"
```

### 2. Get Projects
```bash
curl -X GET "https://xsite.tech/api/project?clientId=YOUR_CLIENT_ID" \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json"
```

### 3. Create Project
```bash
curl -X POST https://xsite.tech/api/project \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "clientId": "YOUR_CLIENT_ID",
    "description": "Test project description"
  }'
```

### 4. Get Labor Entries
```bash
curl -X GET "https://xsite.tech/api/labor?projectId=PROJECT_ID&clientId=CLIENT_ID" \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json"
```

### 5. Add Labor Entry
```bash
curl -X POST https://xsite.tech/api/labor \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "sectionId": "SECTION_ID",
    "clientId": "CLIENT_ID",
    "laborEntries": [
      {
        "type": "Mason",
        "category": "Civil / Structural Works",
        "count": 5,
        "perLaborCost": 500,
        "totalCost": 2500
      }
    ]
  }'
```

### 6. Get Staff
```bash
curl -X GET "https://xsite.tech/api/users/staff?clientId=CLIENT_ID" \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json"
```

### 7. Health Check (Now Protected)
```bash
curl -X GET https://xsite.tech/api/health \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9."
```

---

## ❌ **Testing 401 Errors (Should Fail Without Token)**

Try these protected endpoints WITHOUT Bearer token to confirm they're properly secured:

### 1. Try to Get Projects Without Token
```bash
curl -X GET "https://xsite.tech/api/project?clientId=test" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Authorization header missing or malformed. Use: Bearer <token>",
  "status": 401
}
```

### 2. Try to Get User Data Without Token
```bash
curl -X GET "https://xsite.tech/api/clients?email=test@example.com" \
  -H "Content-Type: application/json"
```

**Expected Response:** `401 Unauthorized`

### 3. Try Health Check Without Token
```bash
curl -X GET https://xsite.tech/api/health
```

**Expected Response:** `401 Unauthorized`

---

## 🧪 **Using Postman for Testing**

### Setup Environment Variables
1. Create new environment in Postman
2. Add variables:
   - `baseUrl`: `https://xsite.tech`
   - `bearerToken`: `eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9.`

### For Protected Endpoints:
1. Go to **Authorization** tab
2. Select **Bearer Token**
3. Enter: `{{bearerToken}}`

### For Unprotected Endpoints:
1. Go to **Authorization** tab  
2. Select **No Auth**

---

## 🔍 **Testing Scenarios**

### Scenario 1: Complete Login Flow (No Token Required)
```bash
# Step 1: Check if user exists
curl -X POST https://xsite.tech/api/findUser \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Step 2: If user exists, login
curl -X POST https://xsite.tech/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Scenario 2: Registration Flow (No Token Required)
```bash
# Step 1: Send OTP
curl -X POST https://xsite.tech/api/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "OTP": 123456}'

# Step 2: Set password after OTP verification
curl -X POST https://xsite.tech/api/password \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "NewPass123!", "userType": "client"}'
```

### Scenario 3: Data Operations (Token Required)
```bash
# Get user projects (requires token)
curl -X GET "https://xsite.tech/api/project?clientId=CLIENT_ID" \
  -H "Authorization: Bearer eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9." \
  -H "Content-Type: application/json"
```

---

## 📱 **Testing from Your React Native App**

### Disable Bearer Token Temporarily
If you want to test without Bearer token from your app, you can temporarily modify the axios config:

```typescript
// In Xsite/utils/axiosConfig.ts - TEMPORARY FOR TESTING ONLY
const apiClient = axios.create({
  baseURL: domain,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${BEARER_TOKEN}`, // Comment this out for testing
  },
});
```

### Test Specific Endpoints
```typescript
// Test unprotected endpoint
const testFindUser = async () => {
  try {
    const response = await fetch('https://xsite.tech/api/findUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    console.log('Response:', await response.json());
  } catch (error) {
    console.error('Error:', error);
  }
};

// Test protected endpoint without token (should fail)
const testProtectedWithoutToken = async () => {
  try {
    const response = await fetch('https://xsite.tech/api/project?clientId=test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header - should get 401
      }
    });
    console.log('Response:', await response.json());
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📊 **Expected Results Summary**

| Endpoint | Without Token | With Token |
|----------|---------------|------------|
| `/api/findUser` | ✅ 200/201/404 | ✅ 200/201/404 |
| `/api/login` | ✅ 200/400/401 | ✅ 200/400/401 |
| `/api/otp` | ✅ 200/400/429 | ✅ 200/400/429 |
| `/api/password` | ✅ 200/400/404 | ✅ 200/400/404 |
| `/api/forget-password` | ✅ 200/400/404 | ✅ 200/400/404 |
| `/api/public/*` | ✅ 200 | ✅ 200 |
| `/api/project` | ❌ 401 | ✅ 200/400/404 |
| `/api/labor` | ❌ 401 | ✅ 200/400/404 |
| `/api/clients` | ❌ 401 | ✅ 200/400/404 |
| `/api/health` | ❌ 401 | ✅ 200 |

This testing guide will help you verify that your API authentication is working correctly!