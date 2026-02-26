import { PhoneType } from "@/schema/phone.schema";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";

const PHONE_NUMER_KEY = 'phone_number_here';

export const addNumber = async (newNumber: PhoneType) => {
  try {
    const existingData = await AsyncStorage.getItem(PHONE_NUMER_KEY);
    let currentNumbers = [];
    if (existingData !== null) {
      const parsed = JSON.parse(existingData);
      currentNumbers = Array.isArray(parsed) ? parsed : [parsed];
    }
    const updatedNumbers = [...currentNumbers, newNumber];
    await AsyncStorage.setItem(PHONE_NUMER_KEY, JSON.stringify(updatedNumbers));
    toast.success('Number saved!');
  } catch (error) {
    console.log("Error saving number:", error);
    toast.error('Failed to save');
  }
};

export const getNumbers = async () => {
  try {
    const nums = await AsyncStorage.getItem(PHONE_NUMER_KEY);
    return nums != null ? JSON.parse(nums) : [];
  } catch (error) {
    console.error("Error fetching numbers:", error);
    return [];
  }
}

export const deleteNumber = async () => {
  try {

  } catch (error) {
    console.log(error);
  }
}
