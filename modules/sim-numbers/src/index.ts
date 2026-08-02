import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import type { SimNumberInfo } from './SimNumbers.types';

const SimNumbersModule = Platform.OS === 'android' ? requireNativeModule('SimNumbers') : null;

export async function getSimNumbers(): Promise<SimNumberInfo[]> {
  if (!SimNumbersModule) {
    return [];
  }
  return SimNumbersModule.getSimNumbers();
}

export type { SimNumberInfo };
