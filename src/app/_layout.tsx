import { Stack } from "expo-router";
import { DeckProvider } from "@/store/decks";

export default function RootLayout() {
  return (
    <DeckProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
        <Stack.Screen name="create" options={{ title: "Create Deck" }} />
        <Stack.Screen name="preview" options={{ title: "Preview Deck" }} />
      </Stack>
    </DeckProvider>
  );
}