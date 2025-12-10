/**
 * STANDALONE TEST - Copy this into your app to test Activity API directly
 * 
 * Add a button in your UI that calls this function
 */

import { domain } from '@/lib/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const testDirectActivityAPICall = async () => {
    console.log('\n========================================');
    console.log('🧪 STANDALONE ACTIVITY API TEST');
    console.log('========================================\n');

    try {
        // Step 1: Get user data
        console.log('Step 1: Getting user from AsyncStorage...');
        const userString = await AsyncStorage.getItem('user');

        if (!userString) {
            console.error('❌ FAILED: No user in AsyncStorage');
            console.error('Solution: Log in first');
            return;
        }

        const userData = JSON.parse(userString);
        console.log('✅ User data:', {
            _id: userData._id,
            clientId: userData.clientId,
            firstName: userData.firstName,
            lastName: userData.lastName,
        });

        if (!userData.clientId) {
            console.error('❌ FAILED: No clientId in user data');
            console.error('Solution: Update login to save clientId');
            return;
        }

        // Step 2: Build payload
        console.log('\nStep 2: Building payload...');
        const payload = {
            user: {
                userId: userData._id || userData.id || 'test',
                fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Test User',
                email: userData.email || 'test@example.com',
            },
            clientId: userData.clientId,
            projectId: 'test-project-' + Date.now(),
            projectName: 'Test Project - Direct API Call',
            activityType: 'project_created',
            category: 'project',
            action: 'create',
            description: 'Test activity - direct API call',
            metadata: {
                test: true,
                timestamp: new Date().toISOString(),
            },
        };

        console.log('✅ Payload built:');
        console.log(JSON.stringify(payload, null, 2));

        // Step 3: Make API call
        console.log('\nStep 3: Calling Activity API...');
        console.log('URL:', `${domain}/api/activity`);
        console.log('Domain:', domain);
        console.log('Making axios.post call NOW...');

        const response = await axios.post(`${domain}/api/activity`, payload);

        console.log('\n✅✅✅ SUCCESS! ✅✅✅');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('\n========================================');
        console.log('🎉 ACTIVITY API IS WORKING!');
        console.log('========================================\n');

        return true;

    } catch (error: any) {
        console.error('\n========================================');
        console.error('❌ TEST FAILED');
        console.error('========================================');
        console.error('Error:', error.message);

        if (error.response) {
            console.error('\nServer Response:');
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 404) {
                console.error('\n💡 Problem: Activity API endpoint not found');
                console.error('   Solution: Create POST /api/activity on backend');
            } else if (error.response.status === 400) {
                console.error('\n💡 Problem: Validation error');
                console.error('   Solution: Check Activity model schema');
            }
        } else if (error.request) {
            console.error('\nNetwork Error: No response from server');
            console.error('  Domain:', domain);
            console.error('  URL:', `${domain}/api/activity`);
            console.error('\n💡 Problem: Cannot reach server');
            console.error('   Solution: Check if backend is running');
        } else {
            console.error('\nUnknown Error:', error);
        }

        console.error('========================================\n');
        return false;
    }
};

// HOW TO USE:
// 1. Import this in your component:
//    import { testDirectActivityAPICall } from './TEST_DIRECT_API_CALL';
//
// 2. Add a button:
//    <Button title="Test Activity API" onPress={testDirectActivityAPICall} />
//
// 3. Click the button and check console
