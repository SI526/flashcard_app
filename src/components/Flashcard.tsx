import StarButton from "@/components/StarButton";
import { ORANGE } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, type ScrollView as RNScrollView, StyleSheet, Text, View } from "react-native";
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
  // Shows an edit button in the top-right corner when provided.
  onEdit?: () => void;
  // Optional controlled mode: lets a practice session remember which side was
  // showing (e.g. so Undo can restore it). Omit both to let the card manage itself.
  showingTerm?: boolean;
  onFlip?: (showingTerm: boolean) => void;
  // Ignores taps, e.g. while the card is sliding away.
  disabled?: boolean;
  // Shows a star button in the top-right corner when onToggleStar is provided.
  // Starring never flips the card.
  starred?: boolean;
  onToggleStar?: () => void;
};

// Each half of the flip (turning edge-on, then turning back face-up).
const HALF_FLIP_MS = 150;

const MISSING_TERM_TEXT = "This card doesn’t have a term yet.";

// A single practice card. The term is on the front, the definition on the back,
// and only one side is visible at a time. Click/tap flips it; on web, Space or
// Enter flips it while focused (react-native-web handles keys for role="button").
// Taps during a flip are ignored, so repeated taps never stack up.
// To reset a new card to its term side, render it with a new `key`.
//
// Text too long for the card scrolls inside it (drag, mouse wheel, or arrow
// keys while focused). A scroll cancels the press, so it never flips the card.
export default function Flashcard({
  term,
  definition,
  onEdit,
  showingTerm,
  onFlip,
  disabled,
  starred = false,
  onToggleStar,
}: FlashcardProps) {
  const [internalShowingTerm, setInternalShowingTerm] = useState(true);
  const isControlled = showingTerm !== undefined;
  const isShowingTerm = isControlled ? showingTerm : internalShowingTerm;

  // The side actually rendered lags behind `isShowingTerm` so the text can swap
  // while the card is edge-on, halfway through the flip animation.
  const [renderedShowingTerm, setRenderedShowingTerm] = useState(isShowingTerm);
  const rotation = useSharedValue(0);
  // True from a tap until the card is face-up again.
  const flipping = useRef(false);
  const scrollRef = useRef<RNScrollView>(null);

  function finishFlip() {
    flipping.current = false;
  }

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
    rotation.set(withTiming(0, { duration: HALF_FLIP_MS }, () => {
      scheduleOnRN(finishFlip);
    }));
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
    if (disabled || flipping.current) return;
    flipping.current = true;
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
          style={({ pressed }) => [
            styles.face,
            (onEdit || onToggleStar) && styles.faceWithEdit,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.text}>{renderedShowingTerm ? termText : definition}</Text>
        </Pressable>
      </ScrollView>
      {/* Which side this is, and how to flip it. They swap with the text, halfway
          through the flip. Screen readers get this from the press's label and hint. */}
      <Text aria-hidden pointerEvents="none" style={styles.sideLabel}>
        {renderedShowingTerm ? "Term" : "Definition"}
      </Text>
      <Text aria-hidden pointerEvents="none" style={styles.hint}>
        {renderedShowingTerm ? "Tap card to flip" : "Tap card to flip back"}
      </Text>
      {onToggleStar && (
        <View style={[styles.starSlot, !onEdit && styles.starSlotAlone]}>
          <StarButton starred={starred} term={termText} onPress={onToggleStar} boxed />
        </View>
      )}
      {onEdit && (
        <Pressable
          role="button"
          accessibilityLabel="Edit card"
          onPress={onEdit}
          style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
        >
          <SymbolView name={{ ios: "pencil", android: "edit", web: "edit" }} size={18} tintColor="#000" />
        </Pressable>
      )}
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
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
  },
  // Grows to fill the card so short text stays centered and the whole card is
  // tappable; longer text makes it taller than the card, which then scrolls.
  scrollContent: {
    flexGrow: 1,
  },
  // The vertical padding keeps the text clear of the side label and the hint.
  face: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  // Keeps the text clear of the edit button.
  faceWithEdit: {
    paddingTop: 56,
  },
  pressed: {
    opacity: 0.7,
  },
  // "TERM" / "DEFINITION" in the top-left corner (Sprint 3 mockup).
  sideLabel: {
    position: "absolute",
    top: 20,
    left: 22,
    color: "#8B909A",
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hint: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    color: "#8B909A",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 12,
  },
  // Just left of the edit button (or in the corner without one).
  starSlot: {
    position: "absolute",
    top: 10,
    right: 54,
  },
  starSlotAlone: {
    right: 10,
  },
  editButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  editButtonPressed: {
    backgroundColor: "#F2F2F2",
  },
  text: {
    color: "#000000",
    fontSize: 17,
    textAlign: "center",
  },
});
