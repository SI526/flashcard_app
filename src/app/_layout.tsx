import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DeckProvider } from "@/store/decks";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DeckProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
          <Stack.Screen name="create" options={{ title: "Create Deck" }} />
          <Stack.Screen name="preview" options={{ title: "Preview Deck" }} />
          <Stack.Screen name="study" options={{ headerShown: false }} />
        </Stack>
      </DeckProvider>
    </GestureHandlerRootView>
  );
}