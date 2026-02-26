import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { loadCheck } from '@/controllers/onboarding.controller';
import { Toaster } from 'sonner-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'regular': require('@/assets/fonts/NoirPro-Regular.ttf'),
    'light': require('@/assets/fonts/NoirPro-Light.ttf'),
    'Medium': require('@/assets/fonts/NoirPro-Medium.ttf'),
    'bold': require('@/assets/fonts/NoirPro-Bold.ttf'),
    'heavy': require('@/assets/fonts/NoirPro-Heavy.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        const checked = await loadCheck();
        if (checked) {
          setShouldRedirect(true);
        }
      } catch (e) {
        console.warn("Initialization Error:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && (fontsLoaded || fontError)) {
      if (shouldRedirect) {
        const timer = setTimeout(() => {
          router.replace('/share');
          SplashScreen.hideAsync();
        }, 1);
        return () => clearTimeout(timer);
      } else {
        SplashScreen.hideAsync();
      }
    }
  }, [appIsReady, fontsLoaded, fontError, shouldRedirect]);

  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <ThemeProvider value={NAV_THEME['dark']}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }} />
          <PortalHost />
          <Toaster />
        </ThemeProvider>
      </View>
    </GestureHandlerRootView>
  );
}
