# License Display in Profile Screen

This document explains how the license information is displayed in the mobile app profile screen.

## License Display Logic

The profile screen now shows license information for non-staff users with the following logic:

### License Values and Display

1. **`license: -1`** → **"Lifetime Access"**
   - Shows green color (#10B981)
   - Displays infinity icon
   - Shows "Unlimited" in license days
   - Shows success message: "You have lifetime access to all features"

2. **`license: 0`** → **"License Expired"**
   - Shows red color (#EF4444)
   - Displays close-circle icon
   - Shows warning message: "Your license has expired. Please contact support to renew"

3. **`license: 1-7`** → **"X days left" (Warning)**
   - Shows orange color (#F59E0B)
   - Displays warning icon
   - Shows alert message: "Your license expires soon. Consider renewing to avoid interruption"

4. **`license: 8+`** → **"X days left" (Active)**
   - Shows blue color (#3B82F6)
   - Displays time icon
   - No warning message

5. **`license: null/undefined`** → **"No License"**
   - Shows gray color (#94A3B8)
   - Displays alert-circle icon

## Features Added

### License Status Card
- **Visual Status Indicator**: Color-coded icons and text based on license status
- **License Details Section**: Shows license days, expiry date, and active status
- **Smart Messaging**: Context-aware warnings and information messages
- **Responsive Design**: Adapts to different license states

### License Information Displayed
- **License Days**: Shows remaining days or "Unlimited" for lifetime access
- **Expiry Date**: Shows formatted expiry date (only for active licenses)
- **Status**: Shows "Active" or "Inactive" based on `isLicenseActive` field
- **Visual Warnings**: Color-coded alerts for expired or expiring licenses

### User Experience
- **Only for Clients**: License information is only shown for non-staff users
- **Loading States**: Shows loading indicator while fetching license data
- **Error Handling**: Graceful handling of missing license data
- **Accessibility**: Clear visual hierarchy and readable text

## Implementation Details

### Data Flow
1. License data is fetched from the client API endpoint
2. `getLicenseStatus()` function determines display properties
3. UI renders appropriate colors, icons, and messages
4. Real-time updates when license data changes

### API Integration
The license data comes from the Client model with these fields:
- `license`: Number of remaining days (-1 for lifetime, 0 for expired)
- `licenseExpiryDate`: ISO date string for expiry
- `isLicenseActive`: Boolean flag for license status

### Visual Design
- **Card Layout**: Clean card design with header and details sections
- **Color Coding**: Consistent color scheme across the app
- **Icons**: Meaningful icons for different license states
- **Typography**: Clear hierarchy with proper font weights and sizes

## Usage Examples

### Lifetime Access User
```
License Status
🔄 Lifetime Access
License Days: Unlimited
Status: Active
✅ You have lifetime access to all features.
```

### Active License (30 days)
```
License Status
⏰ 30 days left
License Days: 30
Expires On: 15 Mar 2024
Status: Active
```

### Expiring Soon (3 days)
```
License Status
⚠️ 3 days left
License Days: 3
Expires On: 3 Feb 2024
Status: Active
⚠️ Your license expires soon. Consider renewing to avoid interruption.
```

### Expired License
```
License Status
❌ License Expired
License Days: 0
Status: Inactive
⚠️ Your license has expired. Please contact support to renew.
```

## Technical Notes

- License decrementation happens server-side via the cron job system
- The mobile app displays the current license value from the database
- No client-side license manipulation occurs
- License status updates in real-time when the profile screen is refreshed
- Staff users don't see license information as they're managed differently