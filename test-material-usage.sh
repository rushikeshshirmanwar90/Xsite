#!/bin/bash

echo "🧪 Material Usage API Diagnostic Tool"
echo "======================================"
echo ""

# Configuration
BEARER_TOKEN="eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9."
DOMAIN="http://localhost:3000"

echo "📍 API Domain: $DOMAIN"
echo "🔑 Bearer Token: ${BEARER_TOKEN:0:20}..."
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. Install it for better output formatting:"
    echo "   brew install jq"
    echo ""
fi

echo "Please provide the following information:"
echo ""

# Get Project ID
read -p "📦 Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

# Get Client ID
read -p "👤 Client ID: " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
    echo "❌ Client ID is required"
    exit 1
fi

# Get Section ID
read -p "📂 Section ID: " SECTION_ID
if [ -z "$SECTION_ID" ]; then
    echo "❌ Section ID is required"
    exit 1
fi

echo ""
echo "🔍 Testing Material Usage API..."
echo "================================"
echo ""

# Test 1: Fetch all used materials for the section
echo "Test 1: Fetch all used materials"
echo "---------------------------------"
URL="$DOMAIN/api/material-usage?projectId=$PROJECT_ID&clientId=$CLIENT_ID&sectionId=$SECTION_ID&page=1&limit=10"
echo "URL: $URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$URL" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API call successful!"
    echo ""
    
    if command -v jq &> /dev/null; then
        echo "Response:"
        echo "$BODY" | jq '.'
        echo ""
        
        # Extract key information
        MATERIALS_COUNT=$(echo "$BODY" | jq '.MaterialUsed | length')
        TOTAL_ITEMS=$(echo "$BODY" | jq '.pagination.totalItems')
        
        echo "📊 Summary:"
        echo "   - Materials in response: $MATERIALS_COUNT"
        echo "   - Total materials: $TOTAL_ITEMS"
        echo ""
        
        if [ "$MATERIALS_COUNT" = "0" ]; then
            echo "⚠️  No materials found. Possible reasons:"
            echo "   1. No materials have been added to mini-sections yet"
            echo "   2. Wrong sectionId (materials exist in different section)"
            echo "   3. Mini-sections don't have MaterialUsed array"
            echo ""
            echo "💡 Try adding material usage using the 'Add Usage' button in the app"
        else
            echo "✅ Materials found! If they're not showing in the app:"
            echo "   1. Check browser console for errors"
            echo "   2. Clear Expo cache: ./clear-cache.sh"
            echo "   3. Check frontend transformation logic"
        fi
    else
        echo "Response:"
        echo "$BODY"
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Unauthorized (401)"
    echo "   - Check if Bearer token is correct"
    echo "   - Token in axiosConfig.ts: $BEARER_TOKEN"
    echo ""
    echo "Response:"
    echo "$BODY"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ Bad Request (400)"
    echo "   - Check if projectId, clientId, and sectionId are valid"
    echo ""
    echo "Response:"
    echo "$BODY"
else
    echo "❌ Error (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$BODY"
fi

echo ""
echo "================================"
echo ""

# Test 2: Fetch mini-sections
echo "Test 2: Fetch mini-sections for this section"
echo "---------------------------------------------"
URL="$DOMAIN/api/mini-section?sectionId=$SECTION_ID"
echo "URL: $URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$URL" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API call successful!"
    echo ""
    
    if command -v jq &> /dev/null; then
        MINI_SECTIONS_COUNT=$(echo "$BODY" | jq '.data | length')
        echo "📊 Found $MINI_SECTIONS_COUNT mini-section(s)"
        echo ""
        
        if [ "$MINI_SECTIONS_COUNT" = "0" ]; then
            echo "⚠️  No mini-sections found for this section"
            echo "   - Create mini-sections using the 'Add Section' button"
        else
            echo "Mini-sections:"
            echo "$BODY" | jq '.data[] | {name: .name, id: ._id, materialsCount: (.MaterialUsed | length)}'
        fi
    else
        echo "Response:"
        echo "$BODY"
    fi
else
    echo "❌ Error (HTTP $HTTP_CODE)"
    echo "Response:"
    echo "$BODY"
fi

echo ""
echo "================================"
echo "🏁 Diagnostic Complete"
echo ""
