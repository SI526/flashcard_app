import CelebrationToast from "@/components/CelebrationToast";
import PageBackground from "@/components/PageBackground";
import { ORANGE, WHITE } from "@/constants/theme";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Figma: 50 from the top of the screen. On phones with a taller status bar, it
// moves down just enough to stay clear of the clock and battery.
const SCREEN_TOP = 50;

// Shown after every card in a study session is marked known. Matches the
// session-complete screen in the designers' Figma Make prototype: a celebration
// toast with the mascot, then a summary card.
export default function Complete() {
  // The deck id comes from study.tsx, so this page knows which deck was finished.
  // `lastCardId` is the card answered last in the study session.
  // `mode` is "starred" after a "Study starred" session.
  const { id, lastCardId, mode } = useLocalSearchParams<{
    id: string;
    lastCardId?: string;
    mode?: string;
  }>();
  const { getDeck, updateStatus } = useDecks();
  const deck = getDeck(id);
  const insets = useSafeAreaInsets();
  // The top spacing, applied on top of styles.screen (the bottom and sides still
  // stay clear of the home indicator and screen edges).
  const screenTop = { paddingTop: Math.max(SCREEN_TOP, insets.top) };
  const [celebrating, setCelebrating] = useState(true);

  // Replacing this page with a new Study screen starts the session over from card 1.
  // Passing the same id keeps the same deck; `restarted` shows "Session restarted".
  // Restarting also sets the deck back to "Not started" until the first card is flipped.
  function restart() {
    updateStatus(id, "not_started").catch(() => {});
    router.replace({ pathname: "/study", params: { id, restarted: "1" } });
  }

  // Reopens Study on the last card answered, with the other cards still done.
  // If there's no last card (e.g. it was deleted), it starts over like Restart.
  function backToLastQuestion() {
    router.replace({
      pathname: "/study",
      params: lastCardId ? { id, lastCardId } : { id },
    });
  }

  // Closes this page and goes to Your Library (instead of stacking a new one on top).
  function exit() {
    router.dismissTo("/library");
  }

  // A new starred session, with whichever cards are starred now.
  function studyStarredAgain() {
    router.replace({ pathname: "/study", params: { id, mode: "starred" } });
  }

  // Back to the deck page, under this one if it's still there.
  function backToDeck() {
    router.dismissTo({ pathname: "/preview", params: { id } });
  }

  if (!deck) return <Text>Deck not found</Text>;

  if (mode === "starred") {
    const starredCount = deck.cards.filter((card) => card.starred).length;
    return (
      <PageBackground>
        <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.screen, screenTop]}>
          <View style={styles.header}>
            <Pressable role="button" onPress={exit} style={styles.exitButton}>
              <Text style={styles.buttonText}>Finish</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {celebrating && (
              <CelebrationToast
                message="Session complete! Nice work!"
                onDismiss={() => setCelebrating(false)}
              />
            )}

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Starred terms</Text>
              <Text role="heading" style={styles.title}>
                You’ve reviewed your starred terms!
              </Text>
              <Text style={styles.text}>Your stars are saved for next time.</Text>

              <Pressable
                role="button"
                onPress={studyStarredAgain}
                disabled={starredCount === 0}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.firstButton,
                  pressed && styles.pressed,
                  starredCount === 0 && styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>Study starred again</Text>
              </Pressable>
              {starredCount === 0 && (
                <Text style={styles.guidance}>
                  Star terms on the deck page to create a focused study session.
                </Text>
              )}

              <Pressable
                role="button"
                onPress={backToDeck}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Back to deck</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </PageBackground>
    );
  }

  // A session only ends once every card is marked known.
  const total = deck.cards.length;
  const known = total;

  return (
    <PageBackground>
      <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.screen, screenTop]}>
        <View style={styles.header}>
          <Pressable role="button" onPress={exit} style={styles.exitButton}>
            <Text style={styles.buttonText}>Finish</Text>
          </Pressable>
        </View>

        {/* Earlier Complete page design (progress bar + "Restart Flashcards"), kept
            for later. To bring it back, uncomment this and its styles at the bottom.
        <View style={styles.oldBody}>
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
        */}

        <ScrollView contentContainerStyle={styles.body}>
          {celebrating && (
            <CelebrationToast
              message="Session complete! Nice work!"
              onDismiss={() => setCelebrating(false)}
            />
          )}

          <View style={styles.card}>
            <Text style={styles.eyebrow}>Study session</Text>
            <Text role="heading" style={styles.title}>
              You finished all {total} {total === 1 ? "card" : "cards"}
            </Text>
            <Text style={styles.text}>
              Your progress is saved. Take a moment to enjoy the win.
            </Text>

            <View
              style={styles.score}
              accessible
              accessibilityLabel={`${known} ${known === 1 ? "card" : "cards"} known`}
            >
              <Text style={styles.scoreNumber}>{known}</Text>
              <Text style={styles.scoreLabel}>{known === 1 ? "card" : "cards"} known</Text>
            </View>

            <Pressable
              role="button"
              onPress={restart}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>Start a new session</Text>
            </Pressable>

            <Pressable
              role="button"
              onPress={backToLastQuestion}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={styles.backText}>Back to last question</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    // Layout (Figma: padding 50 24 0 24, gap 36). The top 50 is set in the
    // component (screenTop) so it can stay clear of the status bar.
    flex: 1,
    paddingHorizontal: 24,
    gap: 36, // between the Finish row and the toast
  },
  header: {
    // Finish on the right
    alignItems: "flex-end",
  },
  exitButton: {
    width: 85,
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  // Toast and card, starting at the top under the Finish row. Scrolls on short screens.
  body: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 20, // between the toast and the card
  },
  card: {
    width: "100%",
    maxWidth: 490,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 44,
    paddingBottom: 32,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#F2D5BB",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 24px 80px rgba(101, 46, 8, 0.1)",
  },
  eyebrow: {
    color: "#A14505",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#131927",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 32,
  },
  text: {
    marginTop: 14,
    color: "#646A75",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  score: {
    width: 150,
    marginVertical: 28,
    padding: 18,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#FFF2E6",
  },
  scoreNumber: {
    color: "#8E3B03",
    fontFamily: "Inter_600SemiBold",
    fontSize: 34,
    lineHeight: 40,
  },
  scoreLabel: {
    color: "#8E3B03",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 14,
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  buttonText: {
    // Typography (shared by Finish and Start a new session)
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  // Not in the prototype; kept from the earlier Complete page.
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  // Starred version: no score box, so the buttons need their own space.
  firstButton: {
    marginTop: 28,
  },
  guidance: {
    marginTop: 8,
    color: "#646A75",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  // Styles for the earlier Complete page design (commented out above).
  // To bring it back, uncomment these and add TEXT_BLACK to the theme import.
  // oldBody: {
  //   // Layout: fills the rest of the screen and centers the content in it
  //   flex: 1,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   gap: 116, // space between the title and the buttons, measured from the mockup
  //   paddingHorizontal: 24,
  // },
  // middleContent: {
  //   // Layout
  //   width: "100%",
  //   maxWidth: 342, // Figma's 342, but can shrink on narrow phones
  //   alignItems: "center",
  //   gap: 48,
  // },
  // progress: {
  //   // Layout
  //   alignSelf: "stretch",
  //   alignItems: "center",
  //   gap: 16,
  // },
  // progressText: {
  //   // Typography
  //   color: TEXT_BLACK,
  //   fontFamily: "Inter_400Regular",
  //   fontSize: 14,
  //   lineHeight: 20,
  // },
  // progressTrack: {
  //   // Layout
  //   alignSelf: "stretch",
  //   height: 8,
  //   // Style
  //   borderRadius: 999, // fully rounded ends
  //   backgroundColor: "#D9D9D9", // same gray track as study.tsx
  //   overflow: "hidden",
  // },
  // progressFill: {
  //   // Layout
  //   height: "100%",
  //   // Style
  //   borderRadius: 999,
  //   backgroundColor: ORANGE,
  // },
  // completeTitle: {
  //   // Typography (Figma Text Font/H4)
  //   color: TEXT_BLACK,
  //   textAlign: "center",
  //   fontFamily: "Inter_600SemiBold",
  //   fontSize: 28,
  //   lineHeight: 34,
  // },
  // actions: {
  //   // Layout: buttons stretch to this 176 width
  //   width: 176,
  //   alignItems: "center",
  //   gap: 24,
  // },
  // restartButton: {
  //   // Layout
  //   height: 40,
  //   paddingVertical: 12,
  //   paddingHorizontal: 16,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   alignSelf: "stretch",
  //   // Style
  //   borderRadius: 12,
  //   backgroundColor: ORANGE,
  // },
});
