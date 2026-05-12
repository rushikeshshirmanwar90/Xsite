#!/bin/bash

echo "🧹 Clearing all Expo and Metro caches..."

# Remove .expo directory
echo "📁 Removing .expo directory..."
rm -rf .expo

# Remove node_modules/.cache
echo "📁 Removing node_modules/.cache..."
rm -rf node_modules/.cache

# Remove metro cache
echo "📁 Removing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-*

# Clear watchman if installed
if command -v watchman &> /dev/null; then
    echo "👁️ Clearing Watchman..."
    watchman watch-del-all
else
    echo "⚠️ Watchman not installed, skipping..."
fi

echo "✅ All caches cleared!"
echo ""
echo "🚀 Now run: npx expo start --clear"
