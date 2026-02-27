import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";

const PHONE_NUMER_KEY = 'phone_number_here';
const MEDIA_KEY = 'this_is_my_media_bro';

export const clearMyDevData = async () => {
  const keys = [PHONE_NUMER_KEY, MEDIA_KEY];
  try {
    await AsyncStorage.multiRemove(keys);
    toast.success("Contacts and Media cleared");
  } catch (error) {
    toast.error("Error clearing specific data");
  }
};



