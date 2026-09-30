import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CurrencyProvider } from '../context/CurrencyContext';

const PROTECTED = [
  'my-esims',
  'esim-details',
  'esim-qr',
  'EditProfileScreen',
  'PaymentHistoryScreen',
];

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait for bootstrap to finish before making any redirect decisions
    if (isLoading) return;

    const isProtected = PROTECTED.includes(segments[0] as string);
    if (!isAuthenticated && isProtected) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Always render the Stack — never return null here.
  // Returning null unmounts the navigator mid-login which resets navigation state.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="my-esims" />
      <Stack.Screen name="esim-details/[id]" />
      <Stack.Screen name="esim-qr" />
      <Stack.Screen name="explore-plans" />
      <Stack.Screen name="available-plans" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="purchase-success" />
      <Stack.Screen name="EditProfileScreen" />
      <Stack.Screen name="PaymentHistoryScreen" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CurrencyProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </CurrencyProvider>
    </SafeAreaProvider>
  );
}
