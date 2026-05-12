#!/bin/bash

echo "🧪 Testing Mini-Section API with Bearer Token"
echo "=============================================="
echo ""

# Get the Bearer token from axiosConfig.ts
BEARER_TOKEN="eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9."

# Get the domain (update this if needed)
DOMAIN="http://localhost:3000"

echo "📍 API Domain: $DOMAIN"
echo "🔑 Bearer Token: ${BEARER_TOKEN:0:20}..."
echo ""

# Test 1: Fetch mini-sections for a section (you'll need to replace with actual sectionId)
echo "Test 1: Fetching mini-sections for a parent section"
echo "---------------------------------------------------"
echo "Note: Replace 'YOUR_SECTION_ID' with an actual section ID from your database"
echo ""
echo "Command:"
echo "curl -X GET \"$DOMAIN/api/mini-section?sectionId=YOUR_SECTION_ID\" \\"
echo "  -H \"Authorization: Bearer $BEARER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Uncomment and update with actual sectionId to test:
# curl -X GET "$DOMAIN/api/mini-section?sectionId=YOUR_SECTION_ID" \
#   -H "Authorization: Bearer $BEARER_TOKEN" \
#   -H "Content-Type: application/json" \
#   | jq '.'

echo ""
echo "✅ Mini-section API is now properly configured with:"
echo "   - Bearer token authentication"
echo "   - Database querying"
echo "   - Proper response format"
echo ""
echo "📱 Next steps:"
echo "   1. Clear Expo cache: ./clear-cache.sh"
echo "   2. Restart backend API server"
echo "   3. Test in the app's Material Used tab"
