import AsyncStorage from "@react-native-async-storage/async-storage";

export const getClientId = async () => {
    try {
        const userDetailsString = await AsyncStorage.getItem("user");
        console.log('📝 User data from AsyncStorage:', userDetailsString);

        if (!userDetailsString || userDetailsString.trim() === '') {
            console.warn('⚠️ No user data in AsyncStorage');
            return null; // Return null instead of fallback
        }

        const userDetails = JSON.parse(userDetailsString);
        console.log('📝 Parsed user data keys:', Object.keys(userDetails || {}));
        console.log('📝 Has _id?', !!userDetails?._id);
        console.log('📝 Has clientId?', !!userDetails?.clientId);
        console.log('📝 Has clientIds?', !!userDetails?.clientIds);
        console.log('📝 Has clients?', !!userDetails?.clients);

        // ✅ Handle both clientId (single) and clients (array) for staff users
        let clientId = '';
        
        // For staff users with clients array, use the first one
        if (userDetails?.clients && Array.isArray(userDetails.clients) && userDetails.clients.length > 0) {
            console.log('👥 Staff user with clients array, using first clientId');
            clientId = userDetails.clients[0].clientId;
        } 
        // Legacy support: For staff users with clientIds array (old format)
        else if (userDetails?.clientIds && Array.isArray(userDetails.clientIds) && userDetails.clientIds.length > 0) {
            console.log('👥 Staff user with legacy clientIds array, using first clientId');
            clientId = userDetails.clientIds[0];
        } 
        // For other users with single clientId
        else if (userDetails?.clientId) {
            clientId = userDetails.clientId;
        }
        // Fallback to _id for admin users
        else if (userDetails?._id) {
            console.log('🔄 Using _id as fallback for admin user');
            clientId = userDetails._id;
        }

        // Handle ObjectId objects (convert to string)
        if (typeof clientId === 'object' && clientId !== null) {
            console.log('🔄 Converting ObjectId to string');
            clientId = clientId.toString();
        }

        console.log('✅ Extracted clientId:', clientId);
        console.log('✅ ClientId type:', typeof clientId);
        console.log('✅ ClientId length:', clientId.length);

        if (!clientId || clientId === '' || clientId === 'null' || clientId === 'undefined') {
            console.error('❌ ClientId is empty or invalid!');
            console.error('❌ User data:', JSON.stringify(userDetails, null, 2));
            return null; // Return null for invalid clientId
        }

        return clientId;
    } catch (error) {
        console.error('❌ Error getting client ID:', error);
        return null; // Return null on error
    }
};