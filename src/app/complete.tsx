import { ORANGE } from "@/constants/theme";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Shown after every card in a study session is marked known.
export default function Complete() {
  // The deck id comes from study.tsx, so this page knows which deck was finished.
  // `lastCardId` is the card answered last in the study session.
  const { id, lastCardId } = useLocalSearchParams<{ id: string; lastCardId?: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);

  // Replacing this page with a new Study screen starts the session over from card 1.
  // Passing the same id keeps the same deck.
  function restart() {
    router.replace({ pathname: "/study", params: { id } });
  }

  // Reopens Study on the last card answered, with the other cards still done.
  // If there's no last card (e.g. it was deleted), it starts over like Restart.
  function backToLastQuestion() {
    router.replace({
      pathname: "/study",
      params: lastCardId ? { id, lastCardId } : { id },
    });
  }

  // Closes this page and goes back to the Create tab (instead of stacking a new one on top).
  function exit() {
    router.dismissTo("/create");
  }

  if (!deck) return <Text>Deck not found</Text>;

  // Same names as the tracker in study.tsx. Every card is known on this page,
  // so known equals total and the bar is full.
  const total = deck.cards.length;
  const known = total;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={exit} style={styles.exitButton}>
          <Text style={styles.buttonText}>Exit</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.middleContent}>
          <View
            style={styles.progress}
            accessible
            accessibilityLabel={`${known} of ${total} cards known`}
          >
            <Text style={styles.progressText}>
              {known}/{total}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(known / total) * 100}%` },
                ]}
              />
            </View>
          </View>
          <Text style={styles.completeTitle}>You&apos;ve completed studying this deck!</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={restart} style={styles.restartButton}>
            <Text style={styles.buttonText}>Restart Flashcards</Text>
          </Pressable>

          <Pressable onPress={backToLastQuestion} style={styles.backButton}>
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
  progress: {
    // Layout
    alignSelf: "stretch",
    alignItems: "center",
    gap: 16,
  },
  progressText: {
    // Typography
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrack: {
    // Layout
    alignSelf: "stretch",
    height: 8,
    // Style
    borderRadius: 999, // fully rounded ends
    backgroundColor: "#D9D9D9", // same gray track as study.tsx
    overflow: "hidden",
  },
  progressFill: {
    // Layout
    height: "100%",
    // Style
    borderRadius: 999,
    backgroundColor: ORANGE,
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
