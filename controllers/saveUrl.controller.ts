import { MediaType } from "@/schema/media.schema";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";

const MEDIA_KEY = 'this_is_my_media_bro';

export const addUrl = async (newNumber: MediaType) => {
  try {
    const existingData = await AsyncStorage.getItem(MEDIA_KEY);
    let currentUrls = [];
    if (existingData !== null) {
      const parsed = JSON.parse(existingData);
      currentUrls = Array.isArray(parsed) ? parsed : [parsed];
    }
    const updatedUrls = [...currentUrls, newNumber];
    await AsyncStorage.setItem(MEDIA_KEY, JSON.stringify(updatedUrls));
    toast.success('Url saved!');
  } catch (error) {
    console.log("Error saving url:", error);
    toast.error('Failed to save');
  }
};

export const getUrls = async () => {
  try {
    const urls = await AsyncStorage.getItem(MEDIA_KEY);
    return urls != null ? JSON.parse(urls) : [];
  } catch (error) {
    console.error("Error fetching urls:", error);
    return [];
  }
}

export const getTelegramUrls = async () => {
  try {
    const data = await AsyncStorage.getItem(MEDIA_KEY);
    if (!data) return [];

    const jsonUrls: MediaType[] = JSON.parse(data);

    return jsonUrls.filter(item => item.platform === 'telegram');

  } catch (error) {
    console.error("Error fetching TG urls:", error);
    return [];
  }
}


export const getTwitterUrls = async () => {
  try {
    const data = await AsyncStorage.getItem(MEDIA_KEY);
    if (!data) return [];

    const jsonUrls: MediaType[] = JSON.parse(data);

    return jsonUrls.filter(item => item.platform === 'twitter');

  } catch (error) {
    console.error("Error fetching TG urls:", error);
    return [];
  }
}

export const deleteUrlById = async (id: string) => {
  try {
    const existingData = await AsyncStorage.getItem(MEDIA_KEY);
    if (!existingData) return;

    const currentUrls: MediaType[] = JSON.parse(existingData);
    const updatedUrls = currentUrls.filter(
      (item) => item.id !== id
    );

    await AsyncStorage.setItem(MEDIA_KEY, JSON.stringify(updatedUrls));

    toast.success('Media deleted');
    return updatedUrls;
  } catch (error) {
    console.error("Error deleting record:", error);
    toast.error('Failed to delete');
  }
};

