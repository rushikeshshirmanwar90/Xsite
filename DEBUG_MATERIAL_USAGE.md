# Debug Material Usage - Complete Logging Guide

## What Was Added

I've added comprehensive logging throughout the material usage flow to help identify exactly where the issue is occurring.

## How to Debug

### Step 1: Open the Form

1. Navigate to a project details page
2. Click "Add Usage" button
3. **Check Console** - You should see:

```
========================================
📝 MATERIAL USAGE FORM OPENED
========================================
Available Materials Count: X
Mini Sections Count: Y

--- Available Materials ---
  1. Cement:
     _id: "507f1f77bcf86cd799439011" (type: string, exists: true)
     id: 1 (type: number)
     quantity: 100 bags

--- Mini Sections ---
  1. Foundation (_id: 507f...)
========================================
```

**What to Check:**

- ✅ Are materials showing up?
- ✅ Does each material have `_id` field?
- ✅ Is `_id` a string (not undefined)?
- ✅ Are mini sections available?

### Step 2: Select Material

1. Select a mini-section
2. Select a material
3. Enter quantity
4. Click "Record Usage"
5. **Check Console** - You should see:

```
========================================
📋 MATERIAL USAGE FORM - SUBMISSION
========================================
Form Values:
  - Selected Mini-Section ID: 507f... (type: string)
  - Selected Material ID: 507f... (type: string)
  - Quantity: 50 (type: number)

--- Selected Material Full Details ---
  - Name: Cement
  - _id: 507f1f77bcf86cd799439011 (type: string)
  - id: 1 (type: number)
  - Quantity Available: 100 bags
  - Price: 500
  - Full Object: { ... }

--- All Available Materials ---
Total: 5
  1. Cement - _id: "507f..." | id: 1
  2. Steel - _id: "507f..." | id: 2
  ...

========================================
🚀 Calling onSubmit with: {
  miniSectionId: "507f...",
  materialId: "507f...",
  quantity: 50
}
========================================
```

**What to Check:**

- ✅ Is `materialId` a valid MongoDB ObjectId string?
- ✅ Is it NOT a number like "1" or "2"?
- ✅ Does the selected material have all required fields?

### Step 3: API Call

After clicking submit, check console for:

```
========================================
ADD MATERIAL USAGE - DEBUG INFO
========================================
Material ID received: 507f1f77bcf86cd799439011
Material ID type: string
Material ID length: 24

Found material: Cement

✓ Material found: {
  name: "Cement",
  _id: "507f1f77bcf86cd799439011",
  quantity: 100,
  unit: "bags"
}

API Payload: {
  "projectId": "507f...",
  "sectionId": "507f...",
  "miniSectionId": "507f...",
  "materialId": "507f1f77bcf86cd799439011",
  "qnt": 50
}
API Endpoint: http://10.212.65.135:8080/api/material-usage
========================================

🚀 SENDING API REQUEST...
URL: http://10.212.65.135:8080/api/material-usage
Method: POST
Payload: { ... }
Payload Details:
  - projectId: 507f... (type: string)
  - sectionId: 507f... (type: string)
  - miniSectionId: 507f... (type: string)
  - materialId: 507f1f77bcf86cd799439011 (type: string)
  - qnt: 50 (type: number)
```

**What to Check:**

- ✅ Is the material found in availableMaterials?
- ✅ Are all IDs valid MongoDB ObjectIds?
- ✅ Is the API endpoint correct?
- ✅ Is the payload structure correct?

### Step 4: API Response

#### If Success:

```
========================================
✅ API RESPONSE - SUCCESS
========================================
Status: 200
Response Data: {
  "success": true,
  "message": "Material usage added successfully"
}
Success: true
Message: Material usage added successfully
========================================
```

#### If Error:

```
========================================
❌ API RESPONSE - ERROR
========================================
Error Object: { ... }
Error Name: AxiosError
Error Message: Request failed with status code 400
Error Code: ERR_BAD_REQUEST

--- Response Details ---
Status: 400
Status Text: Bad Request
Response Data: {
  "success": false,
  "error": "Material not available",
  "details": "..."
}

--- Request Details ---
Request URL: http://10.212.65.135:8080/api/material-usage
Request Method: post
Request Data: { ... }
========================================

🔴 Showing error toast: Material not available
```

**What to Check:**

- ❌ What is the exact error message?
- ❌ What is the status code?
- ❌ What details does the API provide?
- ❌ Is the request data correct?

## Common Issues and Solutions

### Issue 1: Material \_id is undefined

**Symptom:**

```
_id: undefined (type: undefined, exists: false)
```

**Cause:** API not returning `_id` field

**Solution:**

1. Check the API response for materials
2. Ensure backend includes `_id` in response
3. Check if materials are being transformed correctly

### Issue 2: Material \_id is a number

**Symptom:**

```
_id: 1 (type: number)
```

**Cause:** Using numeric ID instead of MongoDB ObjectId

**Solution:**

1. Backend should use MongoDB ObjectId
2. Check database schema
3. Ensure API returns string `_id`, not numeric `id`

### Issue 3: Material not found in availableMaterials

**Symptom:**

```
❌ Material not found in availableMaterials!
```

**Cause:** ID mismatch between form and materials array

**Solution:**

1. Check if material IDs match exactly
2. Look for type mismatches (string vs number)
3. Verify materials are loaded correctly

### Issue 4: API returns "Material not available"

**Symptom:**

```
Response Data: {
  "error": "Material not available"
}
```

**Possible Causes:**

1. **Material doesn't exist in database**

   - Check if materialId exists in database
   - Verify the ID is correct

2. **Material already used/depleted**

   - Check material quantity in database
   - Verify available quantity > 0

3. **Material belongs to different project**

   - Check if material.projectId matches request.projectId
   - Verify material ownership

4. **Backend validation failing**
   - Check backend logs
   - Verify all required fields are present
   - Check data types match backend expectations

## What to Share for Support

If the issue persists, share these console logs:

1. **Form Opened Log** - Shows available materials
2. **Form Submission Log** - Shows selected values
3. **API Request Log** - Shows payload being sent
4. **API Response Log** - Shows error details

Copy the entire console output from these sections and share it.

## Quick Checklist

Before reporting an issue, verify:

- [ ] Materials have `_id` field (not undefined)
- [ ] `_id` is a string (not a number)
- [ ] `_id` looks like MongoDB ObjectId (24 characters)
- [ ] Material is found in availableMaterials array
- [ ] API endpoint is correct
- [ ] All payload fields are present
- [ ] Payload types are correct (strings for IDs, number for quantity)
- [ ] API response shows the actual error message

## Testing the Fix

1. **Clear app cache** (if possible)
2. **Restart the app**
3. **Navigate to project details**
4. **Open console/debugger**
5. **Click "Add Usage"**
6. **Follow the steps above**
7. **Copy all console logs**
8. **Share the logs if issue persists**

---

**The extensive logging will help us identify exactly where the problem is occurring!**
