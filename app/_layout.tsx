import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { Toaster } from 'sonner-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { palettes } from '@/constants/color';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient()

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = palettes[colorScheme];

  const [fontsLoaded, fontError] = useFonts({
    'regular': require('@/assets/fonts/Manrope.ttf'),
    'light': require('@/assets/fonts/Manrope.ttf'),
    'Medium': require('@/assets/fonts/Manrope.ttf'),
    'bold': require('@/assets/fonts/Manrope.ttf'),
    'heavy': require('@/assets/fonts/Manrope.ttf'),
    'Manrope': require('@/assets/fonts/Manrope.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      setAppIsReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded, fontError]);

  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: palette.background }}>
          <ThemeProvider value={NAV_THEME[colorScheme]}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }} />
            <PortalHost />
            <Toaster />
          </ThemeProvider>
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
