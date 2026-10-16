import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth';
import { MealsProvider } from '@/lib/meals-store';
import { HistoryProvider } from '@/lib/history';
import { ShoppingProvider } from '@/lib/shopping';
import { SyncProvider } from '@/lib/sync';
import { AppProvider } from '@/lib/store';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Vent kort på skriftene så siden ikke blinker med feil skrift. På dårlig nett
  // (i butikken) viser vi appen likevel etter litt, med systemskrift til de er lastet.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Service worker: appen åpner også uten nett, for eksempel i butikken.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError && !gaveUp) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <MealsProvider>
          <ShoppingProvider>
            <SyncProvider>
              <HistoryProvider>
                <AuthProvider>
                  <StatusBar style="dark" />
                  <AuthGate>
                    <AppShell>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: colors.bg },
                        }}
                      />
                    </AppShell>
                  </AuthGate>
                </AuthProvider>
              </HistoryProvider>
            </SyncProvider>
          </ShoppingProvider>
        </MealsProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
