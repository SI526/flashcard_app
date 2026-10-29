import { ORANGE } from "@/constants/theme";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Shown after every card in a study session is marked known.
export default function Complete() {
  // The deck id comes from study.tsx, so this page knows which deck was finished.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);

  // Replacing this page with a new Study screen starts the session over from card 1.
  // Passing the same id keeps the same deck.
  function restart() {
    router.replace({ pathname: "/study", params: { id } });
  }

  // Closes this page and goes back to the Create tab (instead of stacking a new one on top).
  function exit() {
    router.dismissTo("/create");
  }

  if (!deck) return <Text>Deck not found</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={exit} style={styles.exitButton}>
          <Text style={styles.buttonText}>Exit</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.middleContent}>
          {/* TODO: Robin's progress tracker (10/10 + bar) goes here after merging. */}
          <Text style={styles.completeTitle}>You&apos;ve completed studying this deck!</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={restart} style={styles.restartButton}>
            <Text style={styles.buttonText}>Restart Flashcards</Text>
          </Pressable>

          <Pressable onPress={restart} style={styles.backButton}>
            <Text style={styles.backText}>Back to last question</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    // Layout
    flex: 1,
    // Style
    backgroundColor: "#FFFFFF",
  },
  header: {
    // Layout: a 109-wide box in the top-right; the padding pushes Exit 24 in from the edges
    alignSelf: "flex-end",
    width: 109,
    paddingTop: 24,
    paddingRight: 24,
  },
  body: {
    // Layout: fills the rest of the screen and centers the content in it
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 116, // space between the title and the buttons, measured from the mockup
    paddingHorizontal: 24,
  },
  middleContent: {
    // Layout
    width: "100%",
    maxWidth: 342, // Figma's 342, but can shrink on narrow phones
    alignItems: "center",
    gap: 48,
  },
  completeTitle: {
    // Typography (Figma Text Font/H4)
    color: "#131927",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  actions: {
    // Layout: buttons stretch to this 176 width
    width: 176,
    alignItems: "center",
    gap: 24,
  },
  exitButton: {
    // Layout
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  restartButton: {
    // Layout
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  buttonText: {
    // Typography (shared by Exit and Restart Flashcards)
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  backButton: {
    // Layout
    alignSelf: "stretch",
  },
  backText: {
    // Typography
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
