import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import '../lib/i18n';
import { migrateDbIfNeeded } from '../lib/db';
import { AppProvider } from '../lib/AppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="studymate.db" onInit={migrateDbIfNeeded}>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
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
    </>
  );
}
