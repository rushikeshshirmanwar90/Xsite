# 📱 Quick APK/AAB Build Commands

## Prerequisites Check

```bash
# Check if EAS CLI is installed
eas --version

# If not installed, install it
npm install -g eas-cli

# Login to Expo (first time only)
eas login
```

## Build APK (For Testing/Direct Install)

```bash
# Navigate to Xsite folder
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite

# Build APK
eas build -p android --profile preview

# Wait for build to complete (10-20 minutes)
# Download link will be provided in terminal
```

## Build AAB (For Google Play Store)

```bash
# Navigate to Xsite folder
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite

# Build AAB
eas build -p android --profile production

# Wait for build to complete
# Download link will be provided
```

## Check Build Status

```bash
# List all builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Open builds in browser
open https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds
```

## Download & Install APK

### Method 1: Direct Download
1. After build completes, click the download link in terminal
2. Transfer APK to your Android phone
3. Enable "Install from Unknown Sources" in phone settings
4. Install the APK

### Method 2: QR Code
1. Build will show a QR code
2. Scan with your Android phone
3. Download and install

### Method 3: Expo Dashboard
1. Visit: https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds
2. Find your build
3. Click download button
4. Transfer to phone and install

## Troubleshooting

### Build Fails
```bash
# Check build logs
eas build:view [BUILD_ID]

# Reconfigure build
eas build:configure

# Try again
eas build -p android --profile preview
```

### "No credentials found"
```bash
# EAS will automatically create credentials
# Just follow the prompts during first build
```

### "Build queue is full"
```bash
# Wait a few minutes and try again
# Or check Expo status: https://status.expo.dev/
```

## Build Profiles

Your `eas.json` has 3 profiles:

| Profile | Use Case | Output | Command |
|---------|----------|--------|---------|
| `development` | Dev testing with Expo Go | Development build | `eas build -p android --profile development` |
| `preview` | Testing/Internal distribution | APK | `eas build -p android --profile preview` |
| `production` | Play Store submission | AAB | `eas build -p android --profile production` |

## Local Build (Alternative)

If you prefer building locally:

```bash
# Navigate to Android folder
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite/android

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## Common Issues & Solutions

### Issue: "Android project not found"
```bash
cd Xsite
npx expo prebuild --platform android
```

### Issue: "Gradle build failed"
```bash
# Clean gradle cache
cd android
./gradlew clean

# Try build again
cd ..
eas build -p android --profile preview
```

### Issue: "Build takes too long"
- This is normal for first build (15-20 minutes)
- Subsequent builds are faster (5-10 minutes)
- Check build status: `eas build:list`

### Issue: "APK not installing on phone"
1. Enable "Install from Unknown Sources"
2. Check Android version compatibility
3. Uninstall old version first
4. Try downloading APK again

## Quick Reference

```bash
# Full workflow
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite
eas login                                    # First time only
eas build -p android --profile preview       # Build APK
eas build:list                               # Check status
# Download from link provided
# Install on Android phone
```

## Build Configuration Files

Your project already has these configured:

- ✅ `app.json` - App configuration
- ✅ `eas.json` - Build profiles
- ✅ `android/` - Native Android project
- ✅ `package.json` - Dependencies

No additional configuration needed!

## Next Steps After Build

1. **Download APK** from the link provided
2. **Test on device** - Install and test all features
3. **Share with team** - Send APK link to testers
4. **Collect feedback** - Fix any issues
5. **Build production** - When ready for Play Store

## Useful Links

- **Your Builds**: https://expo.dev/accounts/codewithrushi/projects/site_Ex/builds
- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Expo Status**: https://status.expo.dev/
- **Build Troubleshooting**: https://docs.expo.dev/build-reference/troubleshooting/

---

**Ready to build?** Run this command:

```bash
cd /Users/chinmayshrimanwar/Desktop/pamu\ dada/app/Xsite && eas build -p android --profile preview
```
