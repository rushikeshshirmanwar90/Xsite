# Staff Assignment Flow with QR Code

## Overview
This document explains the complete flow for staff members who are not assigned to any client and how admins can assign them using QR codes.

## Features Implemented

### 1. Staff Assignment API (`/api/(users)/staff/assign-client`)

#### POST - Assign Staff to Clients
Adds one or more client IDs to a staff member's `clientIds` array.

**Endpoint:** `POST /api/(users)/staff/assign-client`

**Request Body:**
```json
{
  "staffId": "staff_mongodb_id",
  "clientIds": ["client_id_1", "client_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staffId": "...",
    "staffName": "John Doe",
    "clientIds": ["all", "client", "ids"],
    "newlyAssignedClientIds": ["newly", "added", "ids"],
    "assignedAt": "2026-01-02T..."
  },
  "message": "Staff member assigned to 2 new client(s) successfully"
}
```

#### DELETE - Remove Staff from Clients
Removes one or more client IDs from a staff member's `clientIds` array.

**Endpoint:** `DELETE /api/(users)/staff/assign-client?staffId=123&clientIds=client1,client2`

### 2. Staff Without Clients Screen

When a staff member logs in without any assigned clients, they see:

- **Warning Message**: "No Client Assigned"
- **Staff Details Card**: Shows their name, email, phone, role, and staff ID
- **QR Code**: Contains all staff details in JSON format
- **Action Buttons**:
  - Share Details (via native share)
  - Refresh Status (check if assigned)
  - Logout
- **Instructions**: Step-by-step guide on what to do next

**QR Code Data Structure:**
```json
{
  "staffId": "staff_mongodb_id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "role": "site-engineer",
  "timestamp": "2026-01-02T..."
}
```

### 3. Admin QR Scanner

Admins can scan staff QR codes to quickly assign them:

- **Camera Permission**: Requests camera access
- **QR Scanner**: Full-screen scanner with visual guides
- **Confirmation Dialog**: Shows staff details before assignment
- **Auto-Assignment**: Calls the API and refreshes the staff list
- **Error Handling**: Shows meaningful error messages

### 4. Updated Authentication Flow

The `AuthContext` now handles staff without clients:

- Staff can login even without `clientIds`
- They're marked as authenticated but shown the QR screen
- Once assigned, they can access the full app
- Refresh functionality checks for new assignments

## User Flow

### For Staff Members (Not Assigned)

1. **Login** → Staff logs in with their credentials
2. **Check Assignment** → System checks if `clientIds` array is empty
3. **Show QR Screen** → Display the "No Client Assigned" screen
4. **Generate QR** → QR code with staff details is displayed
5. **Share** → Staff shares QR code or Staff ID with admin
6. **Wait** → Staff waits for admin to assign them
7. **Refresh** → Staff clicks "Refresh Status" to check assignment
8. **Access App** → Once assigned, staff gets full app access

### For Admins (Assigning Staff)

1. **Open Staff Management** → Navigate to staff tab
2. **Click "Scan QR"** → Opens QR scanner modal
3. **Grant Camera Permission** → Allow camera access
4. **Scan QR Code** → Point camera at staff's QR code
5. **Confirm Assignment** → Review staff details and confirm
6. **Auto-Assign** → System calls API and assigns staff
7. **Success** → Staff list refreshes with new member

## Technical Details

### Files Modified/Created

1. **API Route**: `real-estate-apis/app/api/(users)/staff/assign-client/route.ts`
2. **Index Page**: `Xsite/app/index.tsx` - Added staff check logic
3. **Auth Context**: `Xsite/contexts/AuthContext.tsx` - Handle staff without clients
4. **No Client Screen**: `Xsite/components/staff/StaffNoClientScreen.tsx` - New component
5. **QR Scanner**: `Xsite/components/staff/StaffQRScannerModal.tsx` - New component
6. **Staff Header**: `Xsite/components/staff/StaffHeader.tsx` - Added scan button
7. **Staff Management**: `Xsite/app/(tabs)/staff.tsx` - Integrated scanner

### Dependencies Added

- `expo-clipboard` - Copy staff ID to clipboard
- `react-native-qrcode-svg` - Generate QR codes
- `expo-barcode-scanner` - Scan QR codes

### Database Schema

The `Staff` model already has the `clientIds` field:

```typescript
clientIds: {
  type: [String],
  required: false,
}
```

## Testing

### Test Staff Without Clients

1. Create a staff member without `clientIds`
2. Login with that staff account
3. Verify the QR screen appears
4. Check that QR code is generated
5. Test share functionality
6. Test refresh button

### Test Admin Assignment

1. Login as admin
2. Go to staff management
3. Click "Scan QR" button
4. Scan a staff QR code
5. Confirm assignment
6. Verify staff appears in list
7. Verify staff can now access app

### Test API Directly

```bash
# Assign staff to client
curl -X POST http://localhost:3000/api/(users)/staff/assign-client \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff_id_here",
    "clientIds": ["client_id_here"]
  }'

# Remove staff from client
curl -X DELETE "http://localhost:3000/api/(users)/staff/assign-client?staffId=staff_id&clientIds=client_id"
```

## Security Considerations

1. **API Validation**: All IDs are validated before processing
2. **Client Verification**: Checks if clients exist before assignment
3. **Staff Verification**: Checks if staff exists before assignment
4. **Duplicate Prevention**: Prevents assigning same client twice
5. **Permission Check**: Only admins can scan and assign

## Future Enhancements

1. **Batch Assignment**: Assign multiple staff at once
2. **Assignment History**: Track who assigned whom and when
3. **Notification**: Send email/push notification on assignment
4. **QR Code Expiry**: Add timestamp validation for security
5. **Manual Entry**: Allow admins to enter staff ID manually
6. **Assignment Requests**: Staff can request assignment to specific clients

## Troubleshooting

### Staff Can't See QR Screen
- Check if `clientIds` array is truly empty
- Verify `role` field is set correctly
- Check AuthContext logs

### QR Scanner Not Working
- Verify camera permissions are granted
- Check if barcode scanner is installed
- Test on physical device (not simulator)

### Assignment Fails
- Check API logs for errors
- Verify client ID is valid
- Ensure staff ID is correct
- Check network connectivity

## Support

For issues or questions, contact the development team or check the logs:
- Frontend logs: Check React Native debugger
- Backend logs: Check API server console
- Database: Check MongoDB for data consistency
