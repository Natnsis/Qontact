import { PhoneType } from "@/schema/phone.schema";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PHONE_NUMER_KEY = 'phone_number_here';

export const addNumber = async (data: PhoneType) => {
  try {
    await AsyncStorage.setItem(PHONE_NUMER_KEY, JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
}
