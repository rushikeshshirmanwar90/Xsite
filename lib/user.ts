import AsyncStorage from "@react-native-async-storage/async-storage";

export const getUserDetails = async (setUserData: any) => {
  const userDetails = (await AsyncStorage.getItem("user")) || "";
  const data = JSON.parse(userDetails);
  setUserData(data);
};
