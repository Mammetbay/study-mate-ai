import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import '../lib/i18n';
import { initDB } from '../lib/db';
import { AppProvider } from '../lib/AppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [fontsLoaded, error] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    initDB()
      .then(() => {
        setDbInitialized(true);
      })
      .catch((e) => {
        console.error('DB Init error:', e);
        setDbInitialized(true);
      });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || error) && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error, dbInitialized]);

  if ((!fontsLoaded && !error) || !dbInitialized) {
    return null;
  }

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="create-note"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </AppProvider>
  );
}
