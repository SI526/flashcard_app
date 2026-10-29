import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/store/auth";
import { DeckProvider } from "@/store/decks";

// Keep the splash screen up until the fonts are ready, so text never flashes in the wrong font.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  if (fontsLoaded || fontError) {
    SplashScreen.hideAsync();
  }
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <DeckProvider>
          <RootStack />
        </DeckProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Logged-out users only get the welcome/login screens; logged-in users get the app.
// When `isLoggedIn` changes, Expo Router moves the user to the right side automatically.
function RootStack() {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
        <Stack.Screen name="study" options={{ headerShown: false }} />
        <Stack.Screen name="complete" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "", headerShadowVisible: false }} />
        <Stack.Screen name="signup" options={{ title: "", headerShadowVisible: false }} />      </Stack.Protected>
    </Stack>
  );
}