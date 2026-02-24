import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { View } from 'react-native';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'regular': require('@/assets/fonts/NoirPro-Regular.ttf'),
    'light': require('@/assets/fonts/NoirPro-Light.ttf'),
    'Medium': require('@/assets/fonts/NoirPro-Medium.ttf'),
    'bold': require('@/assets/fonts/NoirPro-Bold.ttf'),
    'heavy': require('@/assets/fonts/NoirPro-Heavy.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <ThemeProvider value={NAV_THEME['dark']}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }} />
        <PortalHost />
      </ThemeProvider>
    </View>
  );
}
