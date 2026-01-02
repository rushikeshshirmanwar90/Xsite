# QR Scanner with Upload Feature

## Overview
The QR scanner now supports two methods for scanning staff QR codes:
1. **Scan with Camera** - Real-time camera scanning
2. **Upload from Gallery** - Select a QR code image from device

## Features Added

### 1. Options Screen
When admin clicks "Scan QR" button, they see two options:

```
┌─────────────────────────────────┐
│  📱 Scan QR Code            ✕   │
├─────────────────────────────────┤
│                                 │
│  Choose how you want to scan    │
│  the staff QR code              │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📷  Scan with Camera      │ │
│  │     Use your device       │ │
│  │     camera to scan        │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📤  Upload from Gallery   │ │
│  │     Select a QR code      │ │
│  │     image from device     │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### 2. Camera Scanning
- Full-screen camera view
- Visual scanning guides (corner markers)
- Real-time QR code detection
- "Back to Options" button to return

### 3. Image Upload
- Opens device photo gallery
- Selects QR code image
- Decodes QR code from image
- Shows loading indicator while processing

## How It Works

### For Admin - Camera Scan:
1. Click "Scan QR" button
2. Select "Scan with Camera"
3. Grant camera permission (first time)
4. Point camera at QR code
5. Confirm staff assignment
6. Done!

### For Admin - Upload Image:
1. Click "Scan QR" button
2. Select "Upload from Gallery"
3. Grant photo library permission (first time)
4. Select QR code image
5. Wait for processing
6. Confirm staff assignment
7. Done!

### For Staff:
1. Login without clients
2. See QR code on screen
3. Take screenshot or share QR code
4. Send to admin via any method
5. Admin uploads the image
6. Get assigned!

## Technical Implementation

### New Dependencies:
- `expo-image-picker` - For selecting images from gallery
- `jsqr` - For decoding QR codes from images

### Key Functions:

#### `handlePickImage()`
- Requests media library permissions
- Opens image picker
- Gets selected image URI

#### `decodeQRFromImage(imageUri)`
- Loads image from URI
- Converts to canvas
- Extracts image data
- Uses jsQR to decode
- Processes staff data

#### `processQRData(data)`
- Parses JSON from QR code
- Validates staff data structure
- Shows confirmation dialog
- Calls assignment API

### State Management:
```typescript
const [showOptions, setShowOptions] = useState(true);  // Show options screen
const [showCamera, setShowCamera] = useState(false);   // Show camera view
const [scanned, setScanned] = useState(false);         // QR code scanned
const [isAssigning, setIsAssigning] = useState(false); // Processing assignment
```

## Permissions Required

### iOS (Info.plist):
- `NSCameraUsageDescription` - For camera access
- `NSPhotoLibraryUsageDescription` - For photo library access

### Android (AndroidManifest.xml):
- `android.permission.CAMERA` - For camera access
- `android.permission.READ_EXTERNAL_STORAGE` - For photo access

Both are configured in `app.json` via plugins.

## Error Handling

### Invalid QR Code:
```
Alert: "Invalid QR Code"
Message: "The scanned QR code is not a valid staff assignment code."
Action: Return to options screen
```

### No QR Code in Image:
```
Alert: "No QR Code Found"
Message: "Could not find a valid QR code in the selected image."
Action: Return to options screen
```

### Permission Denied:
```
Alert: "Permission Required"
Message: "Please grant [camera/photo library] permission..."
Action: Close modal
```

### Assignment Failed:
```
Alert: "Assignment Failed"
Message: [Error message from API]
Action: Return to options screen
```

## UI/UX Features

### Options Screen:
- Clean, modern design
- Large, tappable buttons
- Clear icons and descriptions
- Bottom sheet modal style

### Camera View:
- Full-screen camera
- Corner guides for QR positioning
- Instructions at bottom
- "Scan Again" and "Back to Options" buttons

### Loading States:
- Spinner while processing image
- "Processing QR code..." message
- "Assigning staff member..." overlay
- Disabled buttons during processing

## Testing

### Test Camera Scan:
1. Login as admin
2. Click "Scan QR"
3. Select "Scan with Camera"
4. Grant permission
5. Scan a staff QR code
6. Verify assignment works

### Test Image Upload:
1. Login as admin
2. Take screenshot of staff QR code
3. Click "Scan QR"
4. Select "Upload from Gallery"
5. Grant permission
6. Select the screenshot
7. Verify assignment works

### Test Error Cases:
1. Upload non-QR image → Should show error
2. Upload invalid QR code → Should show error
3. Deny permissions → Should show permission screen
4. Cancel image picker → Should return to options

## Restart Instructions

After installing new packages, restart the server:

```bash
# Stop current server (Ctrl+C)
npx expo start -c
```

Then rebuild the app on your device.

## Benefits

### For Admins:
- ✅ More flexible scanning options
- ✅ Can assign staff remotely (via image)
- ✅ Works even if camera is broken
- ✅ Can process screenshots/photos

### For Staff:
- ✅ Can share QR via any method
- ✅ Screenshot and send via email/chat
- ✅ No need to be physically present
- ✅ Faster onboarding process

## Future Enhancements

1. **Batch Upload** - Upload multiple QR codes at once
2. **QR Code Validation** - Check expiry timestamp
3. **History** - Show recently scanned staff
4. **Crop Tool** - Crop QR code from larger image
5. **Share QR** - Staff can share directly from app
6. **Email Integration** - Send QR code via email

## Troubleshooting

### Image upload not working:
- Check photo library permissions
- Try with a clearer image
- Ensure QR code is visible and not blurry
- Try camera scan instead

### Camera not working:
- Check camera permissions
- Restart the app
- Try image upload instead
- Check if camera works in other apps

### QR code not detected:
- Ensure good lighting
- Hold camera steady
- Move closer/farther from QR code
- Try uploading image instead

## Support

For issues or questions:
1. Check console logs for errors
2. Verify permissions are granted
3. Test with a clear QR code image
4. Contact development team
