import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'last_slide_check';

export const addCheck = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify('i am gru'));
  } catch (error) {
    console.log(error)
  }
}

export const loadCheck = async () => {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (stored !== null) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error)
  }
}
