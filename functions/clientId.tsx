import AsyncStorage from "@react-native-async-storage/async-storage";

export const getClientId = async () => {
    try {
        const userDetailsString = await AsyncStorage.getItem("user");
        console.log(userDetailsString);
        const userDetails = userDetailsString ? JSON.parse(userDetailsString) : null;
        return userDetails?._id || ''
    } catch (error) {
        console.error('Error getting client ID:', error);
    }
};