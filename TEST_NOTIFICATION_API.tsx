/**
 * TEST SCRIPT: Verify Activity API Response Format
 * 
 * This script tests the Activity API to see what format it returns data in.
 * Run this to debug why activities aren't showing in the notification screen.
 * 
 * INSTRUCTIONS:
 * 1. Replace YOUR_CLIENT_ID with your actual clientId
 * 2. Run this script: npx ts-node TEST_NOTIFICATION_API.tsx
 * 3. Check the console output to see the exact API response format
 */

import axios from 'axios';

const domain = "http://10.127.223.135:8080";
const clientId = "YOUR_CLIENT_ID"; // Replace with actual clientId

async function testActivityAPI() {
    console.log('\n========================================');
    console.log('TESTING ACTIVITY API');
    console.log('========================================\n');

    try {
        console.log('🌐 Fetching from:', `${domain}/api/activity?clientId=${clientId}&limit=50`);

        const response = await axios.get(`${domain}/api/activity?clientId=${clientId}&limit=50`);

        console.log('\n✅ SUCCESS! API Response:');
        console.log('Status:', response.status);
        console.log('\n📦 Response Data Structure:');
        console.log(JSON.stringify(response.data, null, 2));

        console.log('\n📊 Data Analysis:');
        console.log('- Type:', typeof response.data);
        console.log('- Is Array?', Array.isArray(response.data));

        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log('- Object Keys:', Object.keys(response.data));

            // Check common property names
            if (response.data.activities) {
                console.log('- Has "activities" property:', true);
                console.log('- activities is Array?', Array.isArray(response.data.activities));
                console.log('- activities count:', response.data.activities?.length || 0);
            }
            if (response.data.data) {
                console.log('- Has "data" property:', true);
                console.log('- data is Array?', Array.isArray(response.data.data));
                console.log('- data count:', response.data.data?.length || 0);
            }
            if (response.data.activity) {
                console.log('- Has "activity" property:', true);
                console.log('- activity is Array?', Array.isArray(response.data.activity));
                console.log('- activity count:', response.data.activity?.length || 0);
            }
        } else if (Array.isArray(response.data)) {
            console.log('- Direct array count:', response.data.length);
        }

        console.log('\n========================================\n');

    } catch (error: any) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);

        if (error.response) {
            console.error('\n📡 Server Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\n📡 No response received from server');
        }

        console.error('\n========================================\n');
    }
}

// Also test Material Activity API
async function testMaterialActivityAPI() {
    console.log('\n========================================');
    console.log('TESTING MATERIAL ACTIVITY API');
    console.log('========================================\n');

    try {
        console.log('🌐 Fetching from:', `${domain}/api/materialActivity?clientId=${clientId}&limit=50`);

        const response = await axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=50`);

        console.log('\n✅ SUCCESS! API Response:');
        console.log('Status:', response.status);
        console.log('\n📦 Response Data Structure:');
        console.log(JSON.stringify(response.data, null, 2));

        console.log('\n📊 Data Analysis:');
        console.log('- Type:', typeof response.data);
        console.log('- Is Array?', Array.isArray(response.data));

        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log('- Object Keys:', Object.keys(response.data));
        } else if (Array.isArray(response.data)) {
            console.log('- Direct array count:', response.data.length);
        }

        console.log('\n========================================\n');

    } catch (error: any) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);

        if (error.response) {
            console.error('\n📡 Server Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error('\n========================================\n');
    }
}

// Run both tests
async function runTests() {
    await testActivityAPI();
    await testMaterialActivityAPI();
}

runTests();
