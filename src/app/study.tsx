import CardEditor from "@/components/CardEditor";
import { ORANGE } from "@/constants/theme";
import Flashcard from "@/components/Flashcard";
import PeachBackground from "@/components/PeachBackground";
import { STAR_ERROR, useStarToggle } from "@/hooks/useStarToggle";
import { type Card, useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// The session tracks cards by id and reads their content from the saved deck,
// so edits made while studying show up everywhere, even after an Undo.
// What Undo restores: the remaining card ids in order, which side was showing,
// and which cards are marked "Still learning".
type Snapshot = { remaining: string[]; showingTerm: boolean; learning: string[] };
type Session = Snapshot & { history: Snapshot[] };


// Colors for "Still learning" and "Know", from the Sprint 3 mockup.
const LEARNING_COLOR = "#832523";
const KNOWN_COLOR = "#256533";

const SAVE_ERROR = "We couldn’t save your changes. Please try again.";

function startSession(cardIds: string[]): Session {
  return { remaining: cardIds, showingTerm: true, learning: [], history: [] };
}

// Records a practice choice. The next card always starts term-side up, with
// its definition hidden.
function choose(
  session: Session,
  remaining: string[],
  learning: string[] = session.learning,
): Session {
  const { history, ...snapshot } = session;
  return { remaining, showingTerm: true, learning, history: [...history, snapshot] };
}

// "X": randomly reinsert the current card into the remaining cards, but never
// directly next. If it is the only card left, it comes straight back (index 0),
// term-side up, since `choose` resets the side and the card remounts.
function practiceAgain(session: Session): Session {
  const [current, ...rest] = session.remaining;
  const index =
    rest.length === 0 ? 0 : 1 + Math.floor(Math.random() * rest.length);
  return choose(
    session,
    [...rest.slice(0, index), current, ...rest.slice(index)],
    session.learning.includes(current) ? session.learning : [...session.learning, current],
  );
}

// "Check": the current card is known, so drop it for the rest of the session.
// It no longer counts as "Still learning".
function markKnown(session: Session): Session {
  const [current, ...rest] = session.remaining;
  return choose(session, rest, session.learning.filter((id) => id !== current));
}

// "Shuffle cards": put the remaining cards in a random order for this session
// only (the saved deck is never touched). Each card is moved whole, so terms
// stay with their definitions. With two or more cards the order always changes,
// so the button never seems to do nothing.
function shuffle(session: Session): Session {
  const cards = session.remaining;
  if (cards.length < 2) return session;
  let shuffled: string[];
  do {
    shuffled = [...cards];
    // Fisher–Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (shuffled.every((card, i) => card === cards[i]));
  return choose(session, shuffled);
}

// A deleted card is gone for good, so it's also dropped from every Undo
// snapshot. The next card appears term-side up.
function removeCard(session: Session, cardId: string): Session {
  const without = (snapshot: Snapshot) => ({
    ...snapshot,
    remaining: snapshot.remaining.filter((id) => id !== cardId),
    learning: snapshot.learning.filter((id) => id !== cardId),
  });
  return { ...without(session), showingTerm: true, history: session.history.map(without) };
}

function undo(session: Session): Session {
  const previous = session.history[session.history.length - 1];
  if (!previous) return session;
  return { ...previous, history: session.history.slice(0, -1) };
}

// Actions that animate. While one plays, every other control is ignored, so
// repeated taps can't stack animations, skip cards or record a choice twice.
type Action = "learning" | "known" | "shuffle" | "undo";

// Short text shown above the card after an action. It's also the only
// feedback when the device asks for reduced motion.
type Feedback = { id: number; text: string; tone: "neutral" | "learning" | "known" };

const FEEDBACK_TEXT = {
  learning: "Still learning",
  known: "Know",
  shuffle: "Cards shuffled",
  undo: "Previous card",
  restart: "Session restarted",
} as const;
const FEEDBACK_MS = 1200;
// After the last card of a starred session is flipped: time to read its
// definition and see 100% before the Complete page.
const STARRED_DONE_DELAY_MS = 1500;

function makeFeedback(kind: keyof typeof FEEDBACK_TEXT): Feedback {
  return {
    id: Date.now(),
    text: FEEDBACK_TEXT[kind],
    tone: kind === "learning" || kind === "known" ? kind : "neutral",
  };
}

// Durations and easings from the designers' Figma Make prototype.
const SORT_MS = 380;
const SORT_EASING = Easing.bezier(0.4, 0, 0.6, 1);
const UNDO_MS = 480;
const UNDO_EASING = Easing.bezier(0.2, 0.75, 0.25, 1);
const SHUFFLE_MS = 680;
const SHUFFLE_EASING = Easing.bezier(0.22, 0.61, 0.36, 1);

export default function StudyScreen() {
  // `lastCardId` is only set when coming from the Complete page's "Back to last question",
  // and `restarted` when coming from its "Restart Flashcards".
  // `mode` is "starred" for "Study starred": only the starred cards.
  const { id, lastCardId, restarted, mode } = useLocalSearchParams<{
    id: string;
    lastCardId?: string;
    restarted?: string;
    mode?: string;
  }>();
  const starredOnly = mode === "starred";
  const { getDeck, updateCard, deleteCard } = useDecks();
  const deck = getDeck(id);
  const { toggle: toggleStar, failed: starFailed } = useStarToggle(id);
  // Follows the device setting. When on, actions happen instantly and only the
  // text feedback confirms them.
  const reduceMotion = useReducedMotion();

  // The cards in this session, fixed when it starts. In a starred session,
  // starring or unstarring cards changes the deck for next time but never this list.
  const [sessionCardIds, setSessionCardIds] = useState(() =>
    (deck?.cards ?? [])
      .filter((card) => !starredOnly || card.starred)
      .map((card) => card.id),
  );
  const [session, setSession] = useState(() => {
    // Back to last question: only that card is left, so the others stay done.
    if (lastCardId && sessionCardIds.includes(lastCardId)) return startSession([lastCardId]);
    return startSession(sessionCardIds);
  });
  // Progress: the cards whose definition has been revealed at least once this
  // session. Kept outside the session so Undo, shuffling, starring and X/check
  // never change it.
  const [revealed, setRevealed] = useState<string[]>(() =>
    lastCardId && sessionCardIds.includes(lastCardId)
      ? sessionCardIds.filter((cardId) => cardId !== lastCardId)
      : [],
  );
  // The unsaved definition while the current card is in editing mode.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The ref blocks a second tap in the same frame; the state re-renders the card.
  const busy = useRef(false);
  const [action, setAction] = useState<Action | null>(null);
  // Coming from "Restart Flashcards", the session opens with that confirmation.
  const [feedback, setFeedback] = useState<Feedback | null>(() =>
    restarted ? makeFeedback("restart") : null,
  );
  const shuffleProgress = useSharedValue(0);

  const cards = deck?.cards ?? [];
  const total = sessionCardIds.length;
  const viewed = revealed.length;
  const knownCount = total - session.remaining.length;
  const learningCount = session.learning.length;
  const current = cards.find((card) => card.id === session.remaining[0]);
  const editing = draft !== null;
  const definitionMissing = draft !== null && draft.trim() === "";

  const showFeedback = (kind: keyof typeof FEEDBACK_TEXT) => {
    setFeedback(makeFeedback(kind));
  };

  // Hides each message after a moment. Native screen readers also hear it;
  // web ones read the role="status" pill instead.
  useEffect(() => {
    if (!feedback) return;
    if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(feedback.text);
    const timeout = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const begin = (next: Action) => {
    if (busy.current) return false;
    busy.current = true;
    setAction(next);
    showFeedback(next);
    return true;
  };

  const finish = () => {
    busy.current = false;
    setAction(null);
  };

  // X / check / swipe. The card slides off first; the choice is recorded once
  // it's gone, so on the last card the animation ends before the Complete page.
  const sort = (kind: "learning" | "known") => {
    if (!current || editing || !begin(kind)) return;
    if (reduceMotion) commitSort(kind);
  };

  const commitSort = (kind: "learning" | "known") => {
    setSession(kind === "known" ? markKnown : practiceAgain);
    finish();
  };

  const handleShuffle = () => {
    if (session.remaining.length < 2 || editing || !begin("shuffle")) return;
    if (reduceMotion) {
      setSession(shuffle);
      finish();
      return;
    }
    shuffleProgress.set(0);
    shuffleProgress.set(
      withTiming(1, { duration: SHUFFLE_MS, easing: SHUFFLE_EASING }, () => {
        scheduleOnRN(finishShuffle);
      }),
    );
  };

  // The front ghost card now covers the card exactly, so swapping in the new
  // first card underneath it doesn't show a jump.
  const finishShuffle = () => {
    setSession(shuffle);
    shuffleProgress.set(0);
    finish();
  };

  // The previous card slides back in from the left. Progress stays as it is.
  const handleUndo = () => {
    if (session.history.length === 0 || editing || !begin("undo")) return;
    setSession(undo);
    if (reduceMotion) finish();
  };

  const handleFlip = (showingTerm: boolean) => {
    setSession((s) => ({ ...s, showingTerm }));
    // Only the first reveal of each card's definition counts.
    if (!showingTerm && current) {
      const cardId = current.id;
      setRevealed((ids) => (ids.includes(cardId) ? ids : [...ids, cardId]));
    }
  };

  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  // Only leave for the Complete page once, even if both reasons below happen together.
  const completed = useRef(false);
  const complete = (params: Record<string, string>) => {
    if (completed.current) return;
    completed.current = true;
    router.replace({ pathname: "/complete", params });
  };

  // Every card is known: go to the completed page, keeping the same deck id.
  // Also send the card answered last, so "Back to last question" can reopen it.
  const answeredLastId = session.history[session.history.length - 1]?.remaining[0];
  useEffect(() => {
    if (total > 0 && !current) {
      if (starredOnly) complete({ id, mode: "starred" });
      else complete(answeredLastId ? { id, lastCardId: answeredLastId } : { id });
    }
  }, [total, current, id, answeredLastId, starredOnly]);

  // A starred session is done once every card in it has been flipped: progress
  // shows 100%, and after a moment to read the last definition, the Complete
  // page says "You've reviewed your starred terms!".
  const allRevealed = total > 0 && viewed >= total;
  useEffect(() => {
    if (!starredOnly || !allRevealed) return;
    const timeout = setTimeout(() => complete({ id, mode: "starred" }), STARRED_DONE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [starredOnly, allRevealed, id]);

  const startEditing = () => {
    if (!current || busy.current) return;
    setDraft(current.answer);
    setSaveFailed(false);
  };

  const cancelEditing = () => {
    setDraft(null);
    setSaveFailed(false);
  };

  // On failure the draft stays open so the user can try again.
  const saveEdits = async () => {
    if (!deck || !current || draft === null || definitionMissing) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await updateCard(deck.id, current.id, { answer: draft });
      setDraft(null);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  // On failure the card stays in the deck and the draft stays open.
  const confirmDelete = async () => {
    setConfirmingDelete(false);
    if (!deck || !current) return;
    const cardId = current.id;
    setSaving(true);
    setSaveFailed(false);
    try {
      await deleteCard(deck.id, cardId);
      setSession((s) => removeCard(s, cardId));
      setSessionCardIds((ids) => ids.filter((sessionId) => sessionId !== cardId));
      setRevealed((ids) => ids.filter((revealedId) => revealedId !== cardId));
      setDraft(null);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  if (!deck) return <Text>Deck not found</Text>;

  if (total === 0) {
    return (
      <PeachBackground>
        <SafeAreaView style={styles.screen}>
          <View style={styles.body}>
            <View style={styles.doneCard}>
              <Text style={styles.doneText}>
                {starredOnly ? "You don’t have any starred terms yet" : "This deck is empty"}
              </Text>
            </View>
            {starredOnly ? (
              <TextButton label="Back to deck" onPress={exit} />
            ) : (
              <TextButton label="Back to library" onPress={() => router.replace("/library")} />
            )}
          </View>
        </SafeAreaView>
      </PeachBackground>
    );
  }

  const leaving = action === "learning" ? -1 : action === "known" ? 1 : 0;

  return (
    <PeachBackground>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text role="heading" numberOfLines={1} style={styles.deckTitle}>
            {deck.title}
          </Text>
          <Pressable
            role="button"
            onPress={exit}
            disabled={editing}
            style={[styles.finishButton, editing && styles.disabled]}
          >
            <Text style={styles.finishText}>Finish</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={[styles.body, editing && styles.bodyEditing]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.summary}>
            <ProgressBar viewed={viewed} total={total} />
            <View style={styles.counters}>
              <Counter label="Still learning" count={learningCount} tone="learning" />
              <Counter label="Know" count={knownCount} tone="known" />
            </View>
          </View>

          {current && draft !== null ? (
            <View style={styles.editor}>
              <CardEditor
                definition={draft}
                onChange={setDraft}
                onDelete={() => setConfirmingDelete(true)}
                disabled={saving}
              />
              {definitionMissing && (
                <Text role="alert" style={styles.errorText}>
                  Please enter a definition
                </Text>
              )}
              {saveFailed && (
                <Text role="alert" style={styles.errorText}>
                  {SAVE_ERROR}
                </Text>
              )}
              <View style={styles.editButtons}>
                <TextButton label="Cancel" onPress={cancelEditing} disabled={saving} />
                <TextButton
                  label="Save"
                  primary
                  onPress={saveEdits}
                  disabled={saving || definitionMissing}
                />
              </View>
            </View>
          ) : current ? (
            <View style={styles.stage}>
              {action === "shuffle" && <ShuffleGhost progress={shuffleProgress} layer="base" />}
              {action === "shuffle" && <ShuffleGhost progress={shuffleProgress} layer="behind" />}
              <ShufflingCard progress={shuffleProgress}>
                {/* Remount on every choice, undo or deletion, so the card resets its
                    position and appears with the side recorded in the session. */}
                <SwipeableCard
                  key={`${session.history.length}-${current.id}`}
                  card={current}
                  showingTerm={session.showingTerm}
                  locked={action !== null}
                  leaving={reduceMotion ? 0 : leaving}
                  enterFromLeft={action === "undo" && !reduceMotion}
                  onFlip={handleFlip}
                  onEdit={startEditing}
                  onSwipe={(direction) => sort(direction > 0 ? "known" : "learning")}
                  onLeft={(direction) => commitSort(direction > 0 ? "known" : "learning")}
                  onEntered={finish}
                  onToggleStar={() => toggleStar(current)}
                />
              </ShufflingCard>
              {action === "shuffle" && <ShuffleGhost progress={shuffleProgress} layer="front" />}
            </View>
          ) : (
            <View style={styles.doneCard}>
              <Text style={styles.doneText}>You’ve reviewed all your cards!</Text>
            </View>
          )}

          {/* X on the left, check on the right, matching the counters above;
              shuffle and undo in the middle. */}
          <View style={styles.actions}>
            <IconButton
              label="Still learning"
              icon={{ ios: "xmark", android: "close", web: "close" }}
              variant="learning"
              onPress={() => sort("learning")}
              disabled={!current || editing}
            />
            <View style={styles.middleButtons}>
              <IconButton
                label="Shuffle cards"
                icon={{ ios: "shuffle", android: "shuffle", web: "shuffle" }}
                onPress={handleShuffle}
                disabled={session.remaining.length < 2 || editing}
              />
              <IconButton
                label="Undo"
                icon={{ ios: "arrow.uturn.backward", android: "undo", web: "undo" }}
                onPress={handleUndo}
                disabled={session.history.length === 0 || editing}
              />
            </View>
            <IconButton
              label="Know"
              icon={{ ios: "checkmark", android: "check", web: "check" }}
              variant="known"
              onPress={() => sort("known")}
              disabled={!current || editing}
            />
          </View>

          {starFailed && (
            <Text role="alert" style={styles.errorText}>
              {STAR_ERROR}
            </Text>
          )}
        </KeyboardAvoidingView>

        {feedback && <FeedbackPill key={feedback.id} feedback={feedback} />}

        <DeleteConfirmation
          visible={confirmingDelete}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      </SafeAreaView>
    </PeachBackground>
  );
}

// The fill grows smoothly when a new card's definition is revealed. Starred
// sessions use the same "2/5 viewed", counting only the cards in the session.
function ProgressBar({ viewed, total }: { viewed: number; total: number }) {
  const percent = useSharedValue((viewed / total) * 100);

  useEffect(() => {
    percent.set(withTiming((viewed / total) * 100, { duration: 240 }));
  }, [viewed, total, percent]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${percent.get()}%` }));

  return (
    <View
      style={styles.progress}
      accessible
      accessibilityLabel={`${viewed} of ${total} cards viewed`}
    >
      <Text style={styles.progressText}>
        {viewed}/{total} viewed
      </Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
    </View>
  );
}

// A count in a small outlined box: "[0] Still learning" on the left,
// "Know [0]" on the right.
function Counter({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "learning" | "known";
}) {
  const color = tone === "learning" ? LEARNING_COLOR : KNOWN_COLOR;
  const box = (
    <View style={[styles.counterBox, { borderColor: color }]}>
      <Text style={[styles.counterText, { color }]}>{count}</Text>
    </View>
  );
  const text = <Text style={[styles.counterText, { color }]}>{label}</Text>;
  return (
    <View style={styles.counter} accessible accessibilityLabel={`${label}: ${count}`}>
      {tone === "learning" ? (
        <>
          {box}
          {text}
        </>
      ) : (
        <>
          {text}
          {box}
        </>
      )}
    </View>
  );
}

// Pops in near the bottom of the screen, then the screen removes it after FEEDBACK_MS.
function FeedbackPill({ feedback }: { feedback: Feedback }) {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) }));
  }, [shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [
      { translateY: (1 - shown.get()) * 6 },
      { scale: 0.9 + shown.get() * 0.1 },
    ],
  }));

  return (
    <View style={styles.feedbackSlot} pointerEvents="none">
      <Animated.View
        role="status"
        aria-live="polite"
        style={[
          styles.feedback,
          feedback.tone === "learning" && styles.feedbackLearning,
          feedback.tone === "known" && styles.feedbackKnown,
          style,
        ]}
      >
        <Text
          style={[
            styles.feedbackText,
            feedback.tone === "learning" && styles.feedbackTextLearning,
            feedback.tone === "known" && styles.feedbackTextKnown,
          ]}
        >
          {feedback.text}
        </Text>
      </Animated.View>
    </View>
  );
}

// Shuffle: the current card nudges back while a blank card from behind the deck
// swings out to the right and comes around to the front. Both blanks are the
// same card; "behind" shows for the first part and "front" for the rest, which
// avoids animating zIndex. "base" is a second card under the deck for depth.
function ShufflingCard({
  progress,
  children,
}: {
  progress: SharedValue<number>;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      transform: [
        { translateX: interpolate(p, [0, 0.52, 1], [0, -18, -10]) },
        { scale: interpolate(p, [0, 0.52, 1], [1, 0.985, 0.965]) },
        { rotate: `${interpolate(p, [0, 0.52, 1], [0, -1.5, -0.5])}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.stageFill, style]}>{children}</Animated.View>;
}

function ShuffleGhost({
  progress,
  layer,
}: {
  progress: SharedValue<number>;
  layer: "base" | "behind" | "front";
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    if (layer === "base") {
      return {
        transform: [
          { translateX: interpolate(p, [0, 0.55, 1], [9, 5, 0]) },
          { translateY: interpolate(p, [0, 0.55, 1], [-8, -5, 0]) },
          { scale: interpolate(p, [0, 0.55, 1], [0.97, 0.98, 1]) },
        ],
      };
    }
    const atFront = p >= 0.44;
    return {
      opacity: (layer === "front") === atFront ? 1 : 0,
      transform: [
        { translateX: interpolate(p, [0, 0.43, 0.72, 1], [13, 48, 16, 0]) },
        { translateY: interpolate(p, [0, 0.43, 0.72, 1], [-11, 1, 0, 0]) },
        { scale: interpolate(p, [0, 0.43, 0.72, 1], [0.955, 0.98, 1.005, 1]) },
        { rotate: `${interpolate(p, [0, 0.43, 0.72, 1], [0, 3.5, 1, 0])}deg` },
      ],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.ghostCard, style]} />;
}

// How far (px) the card must be dragged to count as a swipe, unless flicked.
const SWIPE_DISTANCE = 120;
const SWIPE_VELOCITY = 800;

type SwipeableCardProps = {
  card: Card;
  showingTerm: boolean;
  // While true, the card can't be dragged or flipped.
  locked: boolean;
  // -1 or 1 slides the card off to that side, then calls onLeft.
  leaving: -1 | 0 | 1;
  // Read on mount only: slide in from the left (Undo), then call onEntered.
  enterFromLeft: boolean;
  onFlip: (showingTerm: boolean) => void;
  onEdit: () => void;
  onSwipe: (direction: -1 | 1) => void;
  onLeft: (direction: -1 | 1) => void;
  onEntered: () => void;
  onToggleStar: () => void;
};

// Drag the card left for "Still learning" or right for "Know"; the buttons do
// the same thing. Short drags spring back; taps still reach the card so it can flip.
function SwipeableCard({
  card,
  showingTerm,
  locked,
  leaving,
  enterFromLeft,
  onFlip,
  onEdit,
  onSwipe,
  onLeft,
  onEntered,
  onToggleStar,
}: SwipeableCardProps) {
  const { width } = useWindowDimensions();
  const [startsOffscreen] = useState(enterFromLeft);
  const translateX = useSharedValue(startsOffscreen ? -1.05 * width : 0);
  const opacity = useSharedValue(startsOffscreen ? 0.45 : 1);

  useEffect(() => {
    if (!startsOffscreen) return;
    opacity.set(withTiming(1, { duration: UNDO_MS, easing: UNDO_EASING }));
    translateX.set(
      withTiming(0, { duration: UNDO_MS, easing: UNDO_EASING }, () => {
        scheduleOnRN(onEntered);
      }),
    );
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (leaving === 0) return;
    const direction = leaving;
    opacity.set(withTiming(0, { duration: SORT_MS, easing: SORT_EASING }));
    translateX.set(
      withTiming(direction * 1.15 * width, { duration: SORT_MS, easing: SORT_EASING }, () => {
        scheduleOnRN(onLeft, direction);
      }),
    );
    // Only when asked to leave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const pan = Gesture.Pan()
    .enabled(!locked)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.set(e.translationX);
    })
    .onEnd((e) => {
      const direction = e.translationX > 0 ? 1 : -1;
      const swiped =
        Math.abs(e.translationX) > SWIPE_DISTANCE ||
        (Math.abs(e.velocityX) > SWIPE_VELOCITY &&
          Math.sign(e.velocityX) === direction);
      if (!swiped) {
        translateX.set(withSpring(0));
        return;
      }
      // The screen records the choice and sets `leaving`, which finishes the slide.
      scheduleOnRN(onSwipe, direction);
    });

  // Tilts up to 7° as the card reaches the edge of the screen.
  const swipeStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      { translateX: translateX.get() },
      { rotate: `${(translateX.get() / (1.15 * width)) * 7}deg` },
    ],
  }));

  // The deck store saves the back of a card as 'answer'; the card calls it 'definition'.
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.stageFill, swipeStyle]}>
        <Flashcard
          term={card.term}
          definition={card.answer}
          onEdit={onEdit}
          showingTerm={showingTerm}
          onFlip={onFlip}
          disabled={locked}
          starred={card.starred}
          onToggleStar={onToggleStar}
        />
      </Animated.View>
    </GestureDetector>
  );
}

type DeleteConfirmationProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// A modal rather than Alert.alert, which does nothing on web.
function DeleteConfirmation({ visible, onCancel, onConfirm }: DeleteConfirmationProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} role="alertdialog" aria-modal>
          <Text style={styles.dialogTitle}>Delete this card from your deck?</Text>
          <Text style={styles.dialogText}>This can’t be undone.</Text>
          <TextButton label="Cancel" primary onPress={onCancel} wide />
          <TextButton label="Delete card" onPress={onConfirm} wide destructive />
        </View>
      </View>
    </Modal>
  );
}

type IconButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  disabled?: boolean;
  // "learning" is filled orange (X), "known" filled green (check);
  // the default is outlined in orange (shuffle, undo).
  variant?: "outline" | "learning" | "known";
};

function IconButton({ label, icon, onPress, disabled, variant = "outline" }: IconButtonProps) {
  const filled = variant !== "outline";
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        variant === "learning" && styles.iconButtonLearning,
        variant === "known" && styles.iconButtonKnown,
        pressed && (filled ? styles.iconButtonFilledPressed : styles.iconButtonPressed),
        disabled && styles.disabled,
      ]}
    >
      <SymbolView name={icon} size={22} tintColor={filled ? "#FFFFFF" : ORANGE} />
    </Pressable>
  );
}

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  destructive?: boolean;
  wide?: boolean;
};

function TextButton({ label, onPress, disabled, primary, destructive, wide }: TextButtonProps) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.textButton,
        primary && styles.textButtonPrimary,
        destructive && styles.textButtonDestructive,
        wide && styles.textButtonWide,
        pressed && styles.textButtonPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.textButtonText,
          primary && styles.textButtonTextPrimary,
          destructive && styles.textButtonTextDestructive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Matches the lo-fi wireframes (design/card-term.png, design/card-definition.png).
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // Deck name on the left, Finish on the right.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 24, // same spot as Exit on the Complete page
  },
  deckTitle: {
    flexShrink: 1,
    color: "#131927",
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
  },
  // Same size and color as the Complete page's Exit button.
  finishButton: {
    // Layout
    width: 85,
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  finishText: {
    // Typography
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  // Tighter, so the editor and its buttons fit on small screens.
  bodyEditing: {
    gap: 20,
  },
  // Progress bar and counters, as wide as the card so the counters line up
  // with its edges.
  summary: {
    width: "100%",
    maxWidth: 480,
    gap: 16,
  },
  progress: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  progressText: {
    color: "#131927",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  counters: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterBox: {
    minWidth: 29,
    height: 24,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  counterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 12,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FFD3B3", // light peach (Sprint 3 mockup)
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  // Same size as the card, so the shuffle's ghost cards line up with it.
  stage: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 345 / 330,
  },
  stageFill: {
    ...StyleSheet.absoluteFill,
  },
  ghostCard: {
    ...StyleSheet.absoluteFill,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5C5A9",
    backgroundColor: "#FFFFFF",
  },
  // Near the bottom of the screen, clear of the card and buttons.
  feedbackSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  feedback: {
    minWidth: 116,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2C3A8",
    backgroundColor: "#FFFFFF",
  },
  feedbackLearning: {
    borderColor: "#E7AAA8",
  },
  feedbackKnown: {
    borderColor: "#9CC9A6",
  },
  feedbackText: {
    color: "#8E3B03",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
  },
  feedbackTextLearning: {
    color: LEARNING_COLOR,
  },
  feedbackTextKnown: {
    color: KNOWN_COLOR,
  },
  editor: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  errorText: {
    color: "#C62828",
    fontSize: 13,
    textAlign: "center",
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
    alignItems: "center",
  },
  middleButtons: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
  },
  iconButtonLearning: {
    backgroundColor: ORANGE,
  },
  iconButtonKnown: {
    borderColor: KNOWN_COLOR,
    backgroundColor: KNOWN_COLOR,
  },
  iconButtonPressed: {
    backgroundColor: "#FFF5EB",
  },
  iconButtonFilledPressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  textButton: {
    minWidth: 110,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  textButtonPrimary: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  textButtonDestructive: {
    borderColor: "#C62828",
  },
  textButtonWide: {
    alignSelf: "stretch",
  },
  textButtonPressed: {
    opacity: 0.7,
  },
  textButtonText: {
    color: "#000000",
    fontSize: 15,
  },
  textButtonTextPrimary: {
    color: "#FFFFFF",
  },
  textButtonTextDestructive: {
    color: "#C62828",
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  dialogTitle: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  dialogText: {
    color: "#555555",
    fontSize: 13,
    textAlign: "center",
  },
});
