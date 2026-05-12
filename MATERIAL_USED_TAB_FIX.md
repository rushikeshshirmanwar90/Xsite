# Material Used Tab API Fix

## Problem Identified

The "Material Used" tab in `details.tsx` was not working properly due to inconsistent API call methods compared to the working `labor.tsx` implementation.

### Root Causes:

1. **Inconsistent API Client Usage**
   - `details.tsx` was using `apiClient` (axios) with `params` option
   - `labor.tsx` was using native `fetch` API with manual query string building
   - The axios `params` serialization might have been causing issues with complex query parameters

2. **Query Parameter Issues**
   - The `usedParams` object includes nested parameters like `miniSectionId` which might not serialize correctly with axios
   - Manual query string building provides better control and debugging

3. **Response Handling Differences**
   - Axios automatically parses JSON and wraps response in `.data`
   - Fetch requires manual JSON parsing with `.json()`

## Solution Applied

### Changed from Axios to Fetch API

**Before (Axios):**
```typescript
const [availableResponse, usedResponse] = await Promise.all([
    apiClient.get(`/api/material`, {
        params: availableParams,
        timeout: 10000
    }),
    apiClient.get(`/api/material-usage`, {
        params: usedParams,
        timeout: 10000
    })
]);

const availableData = availableResponse.data as any;
const usedData = usedResponse.data as any;
```

**After (Fetch):**
```typescript
// Build query strings manually for better control
const buildQueryString = (params: any) => {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
};

const availableQueryString = buildQueryString(availableParams);
const usedQueryString = buildQueryString(usedParams);

// Fetch both available and used materials in parallel using fetch API
const [availableResponse, usedResponse] = await Promise.all([
    fetch(`${domain}/api/material?${availableQueryString}`, {
        method: 'GET',
        headers: {
            ...getAuthHeaders(),
        },
    }),
    fetch(`${domain}/api/material-usage?${usedQueryString}`, {
        method: 'GET',
        headers: {
            ...getAuthHeaders(),
        },
    })
]);

// Check if responses are OK
if (!availableResponse.ok) {
    throw new Error(`Available materials API failed: ${availableResponse.status}`);
}
if (!usedResponse.ok) {
    throw new Error(`Used materials API failed: ${usedResponse.status}`);
}

// Parse JSON responses
const availableData = await availableResponse.json();
const usedData = await usedResponse.json();
```

## Benefits of This Approach

1. **Consistency**: Now both `details.tsx` and `labor.tsx` use the same API call pattern
2. **Better Debugging**: Manual query string building makes it easier to see exactly what's being sent
3. **Explicit Error Handling**: Response status checks before parsing JSON
4. **More Control**: Direct access to response status and headers
5. **Better Logging**: Added comprehensive console logs for debugging

## Testing Checklist

- [ ] Material Available tab loads correctly
- [ ] Material Used tab loads correctly
- [ ] Mini-section filtering works in Used tab
- [ ] Pagination works in both tabs
- [ ] Force refresh works correctly
- [ ] Error messages display properly
- [ ] Console logs show correct API URLs and responses

## Additional Improvements

1. **Enhanced Logging**: Added detailed console logs for:
   - Request parameters
   - API URLs being called
   - Response status codes
   - Data counts

2. **Error Handling**: Improved error messages to show which specific API failed

3. **Query String Building**: Proper URL encoding for all parameters

## Notes

- The `getAuthHeaders()` function from `axiosConfig.ts` is reused for consistency
- The Bearer token is automatically included in all requests
- The `domain` is imported dynamically to ensure the latest configuration is used
