import PageBackground from "@/components/PageBackground";
import BreakRemindersDialog from "@/components/BreakRemindersDialog";
import BreakTimeDialog from "@/components/BreakTimeDialog";
import { useBreakReminders } from "@/hooks/useBreakReminders";
import CardEditor from "@/components/CardEditor";
import { ChevronRightIcon, GearIcon } from "@/components/Icons";
import { useAuth } from "@/store/auth";
import { ERROR_RED, ORANGE, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import Flashcard from "@/components/Flashcard";
import { type Card, useDecks } from "@/store/decks";
import { type SavedSession, useSessions } from "@/store/sessions";
import { useStreaks } from "@/store/streaks";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// The session tracks cards by id and reads their content from the saved deck,
// so edits made while studying show up everywhere, even after an Undo.
// What Undo restores: the remaining card ids in order, plus which side was showing.
type Snapshot = { remaining: string[]; showingTerm: boolean };
type Session = Snapshot & { history: Snapshot[] };


const SAVE_ERROR = "We couldn’t save your changes. Please try again.";

function startSession(cardIds: string[]): Session {
  return { remaining: cardIds, showingTerm: true, history: [] };
}

// Records a practice choice. The next card always starts term-side up.
function choose(session: Session, remaining: string[]): Session {
  const { history, ...snapshot } = session;
  return { remaining, showingTerm: true, history: [...history, snapshot] };
}

// "X": randomly reinsert the current card into the remaining cards, but never
// directly next. If it is the only card left, it comes straight back (index 0),
// term-side up, since `choose` resets the side and the card remounts.
function practiceAgain(session: Session): Session {
  const [current, ...rest] = session.remaining;
  const index =
    rest.length === 0 ? 0 : 1 + Math.floor(Math.random() * rest.length);
  return choose(session, [
    ...rest.slice(0, index),
    current,
    ...rest.slice(index),
  ]);
}

// "Check": the current card is known, so drop it for the rest of the session.
function markKnown(session: Session): Session {
  return choose(session, session.remaining.slice(1));
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
  });
  return { ...without(session), showingTerm: true, history: session.history.map(without) };
}

// The card order to start with. With a saved session: its remaining cards in their
// saved order (minus any deleted since), then any cards added to the deck since.
// Cards that were studied stay done, so progress picks up where it was.
// Without one: every card, in deck order.
function resumeOrder(cardIds: string[], saved: SavedSession | undefined): string[] {
  if (!saved) return cardIds;
  const stillInDeck = saved.remaining.filter((cardId) => cardIds.includes(cardId));
  const addedSince = cardIds.filter((cardId) => !saved.cardIds.includes(cardId));
  return [...stillInDeck, ...addedSince];
}

function undo(session: Session): Session {
  const previous = session.history[session.history.length - 1];
  if (!previous) return session;
  return { ...previous, history: session.history.slice(0, -1) };
}

// Waits for the decks and saved sessions to finish loading (only takes a moment right
// after logging in), so a saved session is never missed and then saved over.
export default function StudyScreen() {
  const { isLoading: decksLoading } = useDecks();
  const { isLoading: sessionsLoading } = useSessions();
  if (decksLoading || sessionsLoading) {
    return (
      <PageBackground>
        <View style={styles.loading}>
          <ActivityIndicator color={ORANGE} />
        </View>
      </PageBackground>
    );
  }
  return <StudySession />;
}

// The study session itself.
function StudySession() {
  // `lastCardId` is only set when coming from the Complete page's "Back to last question".
  const { id, lastCardId } = useLocalSearchParams<{ id: string; lastCardId?: string }>();
  const { getDeck, updateCard, deleteCard, updateStatus } = useDecks();
  const deck = getDeck(id);
  const { recordStudyDay } = useStreaks();
  const { getSavedSession, saveSession, clearSession } = useSessions();

  const [session, setSession] = useState(() => {
    const cardIds = (deck?.cards ?? []).map((card) => card.id);
    // Back to last question: only that card is left, so the others stay done.
    if (lastCardId && cardIds.includes(lastCardId)) return startSession([lastCardId]);
    // Pick up where they left off, if this deck has a saved session.
    return startSession(resumeOrder(cardIds, getSavedSession(id)));
  });

  // Save the user's place whenever the remaining cards change (a ✓, ✗, swipe, shuffle,
  // undo, or deleted card). Once every card is known, the deck is "Reviewed" and the
  // saved place is forgotten. "Back to last question" is a one-card replay of a
  // finished deck, so it never saves or changes the status.
  // Starts as the opening order, so just opening a deck doesn't save anything; if a
  // resumed session is already finished (null), the first run finishes it.
  const lastSavedRemaining = useRef<string[] | null>(
    session.remaining.length === 0 ? null : session.remaining,
  );
  useEffect(() => {
    if (!deck || lastCardId) return;
    if (session.remaining === lastSavedRemaining.current) return;
    lastSavedRemaining.current = session.remaining;
    if (session.remaining.length === 0) {
      clearSession(deck.id);
      if (deck.status !== "reviewed") {
        // Studying keeps going even if saving the status fails.
        updateStatus(deck.id, "reviewed").catch(() => {});
      }
    } else {
      saveSession(deck.id, {
        remaining: session.remaining,
        cardIds: deck.cards.map((card) => card.id),
      });
    }
  }, [deck, lastCardId, session.remaining, saveSession, clearSession, updateStatus]);
  // The unsaved definition while the current card is in editing mode.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // The settings popup from the gear button.
  const [showingSettings, setShowingSettings] = useState(false);
  // Break reminders: study time doesn't count while a popup is open.
  const { isOnBreak, breakSecondsLeft, endBreak } = useBreakReminders(
    showingSettings || confirmingDelete,
  );

  const cards = deck?.cards ?? [];
  const total = cards.length;
  const known = total - session.remaining.length;
  const current = cards.find((card) => card.id === session.remaining[0]);
  const editing = draft !== null;
  const definitionMissing = draft !== null && draft.trim() === "";

  // Study status: the first flip or answer makes a deck "In progress", including a
  // "Reviewed" deck being studied again. (It becomes "Reviewed" once every card is
  // known; see the save effect above.) Just opening a deck doesn't count.
  const markInProgress = () => {
    if (!deck || lastCardId || deck.status === "in_progress") return;
    // Studying keeps going even if saving the status fails.
    updateStatus(deck.id, "in_progress").catch(() => {});
  };

  const handlePracticeAgain = () => {
    markInProgress();
    setSession(practiceAgain);
  };
  const handleMarkKnown = () => {
    // The last card goes straight to "Reviewed" instead (no In progress in between).
    if (session.remaining.length > 1) markInProgress();
    setSession(markKnown);
  };

  // Closes the study screen and goes to Your Library (the place is saved, so
  // Start studying picks up from here later).
  const exit = () => {
    router.dismissTo("/library");
  };

  // Every card is known: go to the completed page, keeping the same deck id.
  // Also send the card answered last, so "Back to last question" can reopen it.
  const answeredLastId = session.history[session.history.length - 1]?.remaining[0];
  useEffect(() => {
    if (total > 0 && !current) {
      router.replace({
        pathname: "/complete",
        params: answeredLastId ? { id, lastCardId: answeredLastId } : { id },
      });
    }
  }, [total, current, id, answeredLastId]);

  const startEditing = () => {
    if (!current) return;
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
      <PageBackground>
        <SafeAreaView style={styles.screen}>
          <View style={styles.body}>
            <View style={styles.doneCard}>
              <Text style={styles.doneText}>This deck is empty</Text>
            </View>
            <TextButton label="Back to library" onPress={() => router.replace("/library")} />
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          {/* Settings: opens the study settings menu (Break reminders, etc.) */}
          <Pressable
            role="button"
            accessibilityLabel="Study settings"
            onPress={() => setShowingSettings(true)}
            disabled={editing}
            style={[styles.settingsButton, editing && styles.disabled]}
          >
            <GearIcon color={ORANGE} />
          </Pressable>
          <Pressable
            role="button"
            onPress={exit}
            disabled={editing}
            style={[styles.exitButton, editing && styles.disabled]}
          >
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={[styles.body, editing && styles.bodyEditing]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
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
            // Remount on every choice, undo or deletion, so the card resets its
            // swipe position and appears with the side recorded in the session.
            <SwipeableCard
              key={`${session.history.length}-${current.id}`}
              card={current}
              showingTerm={session.showingTerm}
              onFlip={(showingTerm) => {
                setSession((s) => ({ ...s, showingTerm }));
                markInProgress();
                // Any flip makes today a study day for the streak (only saved once a day).
                recordStudyDay();
              }}
              onEdit={startEditing}
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
                disabled={!current || editing}
              />
              <IconButton
                label="Mark as known"
                icon={{ ios: "checkmark", android: "check", web: "check" }}
                onPress={handleMarkKnown}
                disabled={!current || editing}
              />
            </View>
            <View style={styles.choiceButtons}>
              <IconButton
                label="Shuffle cards"
                icon={{ ios: "shuffle", android: "shuffle", web: "shuffle" }}
                onPress={() => setSession(shuffle)}
                disabled={session.remaining.length < 2 || editing}
              />
              <IconButton
                label="Undo"
                icon={{ ios: "arrow.counterclockwise", android: "replay", web: "replay" }}
                onPress={() => setSession(undo)}
                disabled={session.history.length === 0 || editing}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        <DeleteConfirmation
          visible={confirmingDelete}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />

        <SettingsMenu visible={showingSettings} onClose={() => setShowingSettings(false)} />

        <BreakTimeDialog visible={isOnBreak} secondsLeft={breakSecondsLeft} onDismiss={endBreak} />
      </SafeAreaView>
    </PageBackground>
  );
}

// How far (px) the card must be dragged to count as a swipe, unless flicked.
const SWIPE_DISTANCE = 120;
const SWIPE_VELOCITY = 800;

type SwipeableCardProps = {
  card: Card;
  showingTerm: boolean;
  onFlip: (showingTerm: boolean) => void;
  onEdit: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

// Drag the card left to practice it again or right to mark it known. Short
// drags spring back; taps still reach the card so it can flip.
function SwipeableCard({
  card,
  showingTerm,
  onFlip,
  onEdit,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableCardProps) {
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
        (Math.abs(e.velocityX) > SWIPE_VELOCITY &&
          Math.sign(e.velocityX) === direction);
      if (!swiped) {
        translateX.value = withSpring(0);
        return;
      }
      translateX.value = withTiming(
        direction * width,
        { duration: 200 },
        (finished) => {
          if (finished)
            scheduleOnRN(direction > 0 ? onSwipeRight : onSwipeLeft);
        },
      );
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
  }));

  // The deck store saves the back of a card as 'answer'; the card calls it 'definition'.
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardSlot, swipeStyle]}>
        <Flashcard
          term={card.term}
          definition={card.answer}
          onEdit={onEdit}
          showingTerm={showingTerm}
          onFlip={onFlip}
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

type SettingsMenuProps = {
  visible: boolean;
  onClose: () => void;
};

// The settings popup from the gear button. Tapping outside the box closes it.
// Only Break reminders for now; the exact menu design is still coming.
// The menu and the Break reminders popup share one Modal (iOS can't open a second
// Modal while the first one is still closing), so this just swaps what's inside.
function SettingsMenu({ visible, onClose }: SettingsMenuProps) {
  const { breakReminders } = useAuth();
  const [page, setPage] = useState<"menu" | "breakReminders">("menu");

  // Always reopen on the menu.
  const close = () => {
    setPage("menu");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      {/* The dark area around the box: tapping it closes the popup */}
      <Pressable style={styles.settingsOverlay} onPress={close} accessibilityLabel="Close settings">
        {/* A plain Pressable here stops taps inside the box from closing it */}
        {page === "menu" ? (
          <Pressable style={styles.settingsBox} role="dialog" aria-modal>
            <Pressable style={styles.settingsRow} onPress={() => setPage("breakReminders")}>
              <Text style={styles.settingsRowText}>Break reminders</Text>
              {/* On when reminders are saved on the account, Off otherwise */}
              <Text style={[styles.settingsRowStatus, breakReminders === null && styles.settingsRowStatusOff]}>
                {breakReminders !== null ? "On" : "Off"}
              </Text>
              <ChevronRightIcon color={TEXT_GREY} />
            </Pressable>
          </Pressable>
        ) : (
          <Pressable style={styles.settingsDialog} role="dialog" aria-modal>
            <BreakRemindersDialog onClose={close} />
          </Pressable>
        )}
      </Pressable>
    </Modal>
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
        disabled && styles.disabled,
      ]}
    >
      <SymbolView name={icon} size={22} tintColor="#000" />
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
  // Spinner in the middle while decks and saved sessions load
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    // Layout: settings and Exit side by side, on the right
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12, // between settings and Exit (estimated until the spec arrives)
    paddingTop: 24, // same spot as Exit on the Complete page
  },
  // Square settings button next to Exit
  settingsButton: {
    // Layout
    height: 40,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE, // Primary-500
  },
  // ─── Settings popup (basic styling until the design is done) ───
  // Dark see-through layer, same as the other popups
  settingsOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(20, 17, 15, 0.48)",
  },
  settingsBox: {
    width: "100%",
    gap: 12,
    padding: 24,
    borderRadius: 16,
    backgroundColor: WHITE,
    boxShadow: "0 8px 32px 0 rgba(19, 25, 39, 0.19)",
  },
  // One option, like the Preferences rows on Edit Profile
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: WHITE,
  },
  settingsRowText: {
    flex: 1,
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  // "On" next to Break reminders, like Study reminders on Edit Profile
  settingsRowStatus: {
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  // "Off" is grey, so "On" in orange stands out
  settingsRowStatusOff: {
    color: TEXT_GREY,
  },
  // Holds the Break reminders popup (it brings its own box styling)
  settingsDialog: {
    width: "100%",
  },
  // Exit matches the Complete page's Exit button.
  exitButton: {
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
  exitText: {
    // Typography
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 46,
  },
  // Tighter, so the editor and its buttons fit on small screens.
  bodyEditing: {
    gap: 20,
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
    backgroundColor: ORANGE,
  },
  cardSlot: {
    width: "100%",
    alignItems: "center",
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
    color: ERROR_RED,
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
    backgroundColor: WHITE,
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
    color: WHITE,
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
    backgroundColor: WHITE,
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
