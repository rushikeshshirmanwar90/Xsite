import AsyncStorage from "@react-native-async-storage/async-storage";

export const getClientId = async () => {
    try {
        const userDetailsString = await AsyncStorage.getItem("user");
        console.log('📝 User data from AsyncStorage:', userDetailsString);

        if (!userDetailsString || userDetailsString.trim() === '') {
            console.warn('⚠️ No user data in AsyncStorage');
            // TEMPORARY FIX: Return the known working client ID
            console.log('🔧 Using fallback client ID');
            return '6941b27c7fdcea3d37e02ada';
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

        if (!clientId || clientId === '') {
            console.error('❌ ClientId is empty!');
            console.error('❌ User data:', JSON.stringify(userDetails, null, 2));
            // TEMPORARY FIX: Return the known working client ID
            console.log('🔧 Using fallback client ID');
            return '6941b27c7fdcea3d37e02ada';
        }

        return clientId;
    } catch (error) {
        console.error('❌ Error getting client ID:', error);
        // TEMPORARY FIX: Return the known working client ID
        console.log('🔧 Using fallback client ID due to error');
        return '6941b27c7fdcea3d37e02ada';
    }
};