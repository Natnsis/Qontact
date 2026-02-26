import { PhoneType } from "@/schema/phone.schema";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";

const PHONE_NUMER_KEY = 'phone_number_here';

export const addNumber = async (data: PhoneType) => {
  try {
    await AsyncStorage.setItem(PHONE_NUMER_KEY, JSON.stringify(data));
    toast.success('number saved!');
  } catch (error) {
    console.log(error);
  }
}

export const getNumbers = async () => {
  try {
    const nums = await AsyncStorage.getItem(PHONE_NUMER_KEY);
    if (nums !== null) {
      return nums
    }
    return
  } catch (error) {
    console.log(error)
  }
}

export const deleteNumber = async () => {
  try {

  } catch (error) {
    console.log(error);
  }
}
