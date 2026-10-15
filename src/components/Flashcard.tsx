import { useEffect, useRef, useState } from "react";
import { Pressable, type ScrollView as RNScrollView, StyleSheet, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type FlashcardProps = {
  term: string;
  definition: string;
  // Optional controlled mode: lets a practice session remember which side was
  // showing (e.g. so Undo can restore it). Omit both to let the card manage itself.
  showingTerm?: boolean;
  onFlip?: (showingTerm: boolean) => void;
};

// Each half of the flip (turning edge-on, then turning back face-up).
const HALF_FLIP_MS = 150;

const MISSING_TERM_TEXT = "This card doesn’t have a term yet.";

// A single practice card. The definition is on the front, the term on the back,
// and only one side is visible at a time. Click/tap flips it; on web, Space or
// Enter flips it while focused (react-native-web handles keys for role="button").
// To reset a new card to its definition side, render it with a new `key`.
//
// Text too long for the card scrolls inside it (drag, mouse wheel, or arrow
// keys while focused). A scroll cancels the press, so it never flips the card.
export default function Flashcard({
  term,
  definition,
  showingTerm,
  onFlip,
}: FlashcardProps) {
  const [internalShowingTerm, setInternalShowingTerm] = useState(false);
  const isControlled = showingTerm !== undefined;
  const isShowingTerm = isControlled ? showingTerm : internalShowingTerm;

  // The side actually rendered lags behind `isShowingTerm` so the text can swap
  // while the card is edge-on, halfway through the flip animation.
  const [renderedShowingTerm, setRenderedShowingTerm] = useState(isShowingTerm);
  const rotation = useSharedValue(0);
  const scrollRef = useRef<RNScrollView>(null);

  useEffect(() => {
    if (renderedShowingTerm === isShowingTerm) {
      // Flipped back before the first half finished: turn face-up again
      // (this also cancels the pending swap below).
      rotation.set(withTiming(0, { duration: HALF_FLIP_MS }));
      return;
    }
    rotation.set(withTiming(90, { duration: HALF_FLIP_MS }, (finished) => {
      if (finished) scheduleOnRN(setRenderedShowingTerm, isShowingTerm);
    }));
    // Only react to the requested side changing, not to the swap itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowingTerm]);

  useEffect(() => {
    rotation.set(withTiming(0, { duration: HALF_FLIP_MS }));
  }, [renderedShowingTerm, rotation]);

  // Each side starts scrolled to the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [renderedShowingTerm]);

  // Reanimated's default reduceMotion setting follows the OS: with reduced motion
  // on, the side swaps instantly with no rotation.
  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${rotation.get()}deg` }],
  }));

  const flip = () => {
    const next = !isShowingTerm;
    if (!isControlled) setInternalShowingTerm(next);
    onFlip?.(next);
  };

  const termText = term.trim() === "" ? MISSING_TERM_TEXT : term;

  return (
    <Animated.View style={[styles.container, flipStyle]}>
      <ScrollView ref={scrollRef} style={styles.card} contentContainerStyle={styles.scrollContent}>
        <Pressable
          role="button"
          accessibilityLabel={isShowingTerm ? `Term: ${termText}` : `Definition: ${definition}`}
          accessibilityHint="Flips the card to its other side"
          onPress={flip}
          style={({ pressed }) => [styles.face, pressed && styles.pressed]}
        >
          <Text style={styles.text}>{renderedShowingTerm ? termText : definition}</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

// Matches the lo-fi wireframes (design/card-term.png, design/card-definition.png):
// a plain, near-square white card with a thin gray border and centered text.
// The card keeps its size however long the text is, so the practice controls
// below it never get pushed off screen.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 345 / 330,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  // Grows to fill the card so short text stays centered and the whole card is
  // tappable; longer text makes it taller than the card, which then scrolls.
  scrollContent: {
    flexGrow: 1,
  },
  face: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: "#000000",
    fontSize: 17,
    textAlign: "center",
  },
});
