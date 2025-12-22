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

        // ✅ FIX: Use clientId field, NOT _id field
        // _id = user's own ID, clientId = the client/company they belong to
        let clientId = userDetails?.clientId || '';

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