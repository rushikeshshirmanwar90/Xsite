# How to Restart the App After Installing Native Modules

## The Issue
You're seeing the error: `Cannot find native module 'ExpoBarCodeScanner'` because:
1. We removed `expo-barcode-scanner` and replaced it with `expo-camera`
2. Native modules require the app to be rebuilt

## Solution - Restart Development Server

### Step 1: Stop the Current Server
Press `Ctrl+C` in your terminal where Expo is running

### Step 2: Clear Cache and Restart
Run one of these commands:

```bash
# Option 1: Clear cache and start fresh
npx expo start -c

# Option 2: If that doesn't work, clear more aggressively
rm -rf node_modules/.cache
npx expo start -c
```

### Step 3: Rebuild the App on Your Device
When the server starts, you'll need to rebuild:

**For Android:**
- Press `a` in the terminal, or
- Scan the QR code again with Expo Go

**For iOS:**
- Press `i` in the terminal, or
- Scan the QR code again with Expo Go

## What Changed

### Removed:
- ❌ `expo-barcode-scanner` (deprecated, causing issues)

### Added:
- ✅ `expo-camera` (modern, better maintained)
- ✅ `expo-clipboard` (for copying staff ID)
- ✅ `react-native-qrcode-svg` (for generating QR codes)

### Updated Files:
1. `app.json` - Changed plugin from `expo-barcode-scanner` to `expo-camera`
2. `StaffQRScannerModal.tsx` - Now uses `CameraView` from `expo-camera`
3. `StaffNoClientScreen.tsx` - Generates QR codes for staff

## Testing After Restart

### Test 1: Staff Without Clients
1. Login with staff account that has empty `clientIds` array
2. You should see the "No Client Assigned" screen
3. Verify QR code is displayed
4. Test "Share Details" button
5. Test "Copy Staff ID" button
6. Test "Refresh Status" button

### Test 2: Admin QR Scanner
1. Login as admin
2. Go to Staff Management tab
3. Click "Scan QR" button
4. Grant camera permission when prompted
5. Point camera at staff QR code
6. Confirm assignment
7. Verify staff appears in list

### Test 3: Manual Assignment
1. Login as admin
2. Go to Staff Management tab
3. Click "Add Staff" button
4. Enter staff ID manually
5. Verify staff details appear
6. Confirm assignment

## Troubleshooting

### If camera still doesn't work:
```bash
# Clear everything and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### If QR code doesn't generate:
- Check that `react-native-svg` is installed
- Restart the app
- Check console for errors

### If assignment fails:
- Check that backend API is running
- Verify client ID is valid
- Check network connectivity
- Look at API logs

## Expected Behavior

### Staff Without Clients:
- ✅ Can login successfully
- ✅ See "No Client Assigned" screen
- ✅ QR code is displayed with their details
- ✅ Can share details via native share
- ✅ Can copy staff ID to clipboard
- ✅ Can refresh to check if assigned
- ✅ Can logout

### Admin:
- ✅ Can scan QR codes
- ✅ Camera permission requested properly
- ✅ QR scanner shows visual guides
- ✅ Confirmation dialog before assignment
- ✅ Staff list refreshes after assignment
- ✅ Success/error messages displayed

## Next Steps

1. **Stop your current Expo server** (Ctrl+C)
2. **Run:** `npx expo start -c`
3. **Rebuild the app** on your device
4. **Test the flow** with a staff account that has no clients
5. **Test scanning** with an admin account

The app should now work without the `ExpoBarCodeScanner` error!
