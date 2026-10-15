import Flashcard from "@/components/Flashcard";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type Card = { id: string; term: string; definition: string };

// What Undo restores: the remaining cards in order, plus which side was showing.
type Snapshot = { remaining: Card[]; showingTerm: boolean };
type Session = Snapshot & { history: Snapshot[] };

function startSession(cards: Card[]): Session {
  return { remaining: cards, showingTerm: false, history: [] };
}

// Records a practice choice. The next card always starts definition-side up.
function choose(session: Session, remaining: Card[]): Session {
  const { history, ...snapshot } = session;
  return { remaining, showingTerm: false, history: [...history, snapshot] };
}

// "X": randomly reinsert the current card into the remaining cards, but never
// directly next. If it is the only card left, it comes straight back (index 0),
// definition-side up, since `choose` resets the side and the card remounts.
function practiceAgain(session: Session): Session {
  const [current, ...rest] = session.remaining;
  const index = rest.length === 0 ? 0 : 1 + Math.floor(Math.random() * rest.length);
  return choose(session, [...rest.slice(0, index), current, ...rest.slice(index)]);
}

// "Check": the current card is known, so drop it for the rest of the session.
function markKnown(session: Session): Session {
  return choose(session, session.remaining.slice(1));
}

function undo(session: Session): Session {
  const previous = session.history[session.history.length - 1];
  if (!previous) return session;
  return { ...previous, history: session.history.slice(0, -1) };
}

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);

  // The deck store saves the back of a card as 'answer'; this screen calls it 'definition'.
  const [session, setSession] = useState(() =>
    startSession(
      (deck?.cards ?? []).map((card) => ({
        id: String(card.id),
        term: card.term,
        definition: card.answer,
      })),
    ),
  );
  const total = deck?.cards.length ?? 0;
  const known = total - session.remaining.length;
  const current = session.remaining[0];

  const handlePracticeAgain = () => setSession(practiceAgain);
  const handleMarkKnown = () => setSession(markKnown);

  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  if (!deck) return <Text>Deck not found</Text>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable role="button" onPress={exit} style={styles.exitButton}>
          <Text style={styles.exitText}>Exit</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View
          style={styles.progress}
          accessible
          accessibilityLabel={`${known} of ${total} cards known`}
        >
          <Text style={styles.progressText}>
            {known}/{total}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(known / total) * 100}%` }]} />
          </View>
        </View>

        {current ? (
          // Remount on every choice or undo, so the card resets its swipe
          // position and appears with the side recorded in the session.
          <SwipeableCard
            key={session.history.length}
            card={current}
            showingTerm={session.showingTerm}
            onFlip={(showingTerm) => setSession((s) => ({ ...s, showingTerm }))}
            onSwipeLeft={handlePracticeAgain}
            onSwipeRight={handleMarkKnown}
          />
        ) : (
          <View style={styles.doneCard}>
            <Text style={styles.doneText}>You’ve reviewed all your cards!</Text>
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.choiceButtons}>
            <IconButton
              label="Practice again"
              icon={{ ios: "xmark", android: "close", web: "close" }}
              onPress={handlePracticeAgain}
              disabled={!current}
            />
            <IconButton
              label="Mark as known"
              icon={{ ios: "checkmark", android: "check", web: "check" }}
              onPress={handleMarkKnown}
              disabled={!current}
            />
          </View>
          <IconButton
            label="Undo"
            icon={{ ios: "arrow.counterclockwise", android: "replay", web: "replay" }}
            onPress={() => setSession(undo)}
            disabled={session.history.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// How far (px) the card must be dragged to count as a swipe, unless flicked.
const SWIPE_DISTANCE = 120;
const SWIPE_VELOCITY = 800;

type SwipeableCardProps = {
  card: Card;
  showingTerm: boolean;
  onFlip: (showingTerm: boolean) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

// Drag the card left to practice it again or right to mark it known. Short
// drags spring back; taps still reach the card so it can flip.
function SwipeableCard({ card, showingTerm, onFlip, onSwipeLeft, onSwipeRight }: SwipeableCardProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const direction = Math.sign(e.translationX);
      const swiped =
        Math.abs(e.translationX) > SWIPE_DISTANCE ||
        (Math.abs(e.velocityX) > SWIPE_VELOCITY && Math.sign(e.velocityX) === direction);
      if (!swiped) {
        translateX.value = withSpring(0);
        return;
      }
      translateX.value = withTiming(direction * width, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(direction > 0 ? onSwipeRight : onSwipeLeft);
      });
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardSlot, swipeStyle]}>
        <Flashcard
          term={card.term}
          definition={card.definition}
          showingTerm={showingTerm}
          onFlip={onFlip}
        />
      </Animated.View>
    </GestureDetector>
  );
}

type IconButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  disabled?: boolean;
};

function IconButton({ label, icon, onPress, disabled }: IconButtonProps) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        disabled && styles.iconButtonDisabled,
      ]}
    >
      <SymbolView name={icon} size={22} tintColor="#000" />
    </Pressable>
  );
}

// Matches the lo-fi wireframes (design/card-term.png, design/card-definition.png).
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "flex-end",
    paddingTop: 12,
  },
  exitButton: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exitText: {
    color: "#000000",
    fontSize: 13,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 46,
  },
  progress: {
    width: "76%",
    maxWidth: 360,
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    color: "#000000",
    fontSize: 13,
  },
  progressTrack: {
    width: "100%",
    height: 9,
    borderRadius: 999,
    backgroundColor: "#D9D9D9",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#000",
  },
  cardSlot: {
    width: "100%",
    alignItems: "center",
  },
  doneCard: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 345 / 330,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  doneText: {
    color: "#000000",
    fontSize: 17,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  choiceButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#000",
  },
  iconButtonPressed: {
    backgroundColor: "#F2F2F2",
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
});
