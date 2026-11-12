import { AddIcon, TrashIcon } from "@/components/Icons";
import PageBackground from "@/components/PageBackground";
import {
    ERROR_RED,
    ORANGE,
    ORANGE_100,
    TEXT_BLACK,
    TEXT_GREY,
    WHITE,
} from "@/constants/theme";
import { type Card, useDecks } from "@/store/decks";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function EditDeck() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck, addCard, updateCard, deleteCard } = useDecks();
  const deck = getDeck(id);
  // A copy of the cards to edit on this page. Finish Editing saves it to Supabase.
  const [cards, setCards] = useState<Card[]>(deck?.cards ?? []);
  const [loadedId, setLoadedId] = useState(id);
  const [loadedCards, setLoadedCards] = useState(deck?.cards);
  const [showCardErrors, setShowCardErrors] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Tabs stay alive in the background, so start over when a different deck opens or
  // its saved cards change (e.g. edited in Study). Not during a save or after a failed
  // one, so unsaved edits stay on screen to try again.
  if (
    !isSaving &&
    saveError === "" &&
    (id !== loadedId || deck?.cards !== loadedCards)
  ) {
    setLoadedId(id);
    setLoadedCards(deck?.cards);
    setCards(deck?.cards ?? []);
    setShowCardErrors(false);
  }

  function changeCardText(
    cardId: string,
    field: "term" | "answer",
    text: string,
  ) {
    setCards((previousCards) =>
      previousCards.map((card) =>
        card.id === cardId ? { ...card, [field]: text } : card,
      ),
    );
  }
  function addNewCard() {
    setCards((previousCards) => [
      ...previousCards,
      { id: `new-${Date.now()}`, term: "", answer: "" },
    ]);
  }
  function removeCard(cardId: string) {
    setCards((previousCards) =>
      previousCards.filter((card) => card.id !== cardId),
    );
  }

  // Saves the page's cards to Supabase, then goes back to Preview.
  async function editingCard() {
    if (!deck) return;
    setSaveError("");
    setShowCardErrors(true);
    if (cards.length === 0) {
      setSaveError("Please add at least one flashcard before finishing.");
      return;
    }
    if (cards.some((card) => card.term === "" || card.answer === "")) {
      return;
    }

    setIsSaving(true);
    try {
      for (const card of cards) {
        const savedCard = deck.cards.find((saved) => saved.id === card.id);
        const { term, answer } = card;
        if (!savedCard) {
          const newId = await addCard(id, { term, answer });
          // Keep the real id, so trying again after a failure can't add it twice.
          setCards((previousCards) =>
            previousCards.map((previous) =>
              previous.id === card.id ? { ...previous, id: newId } : previous,
            ),
          );
        } else if (savedCard.term !== term || savedCard.answer !== answer) {
          await updateCard(id, card.id, { term, answer });
        }
      }
      // Delete last, so a failed save can't leave the deck with no cards.
      for (const savedCard of deck.cards) {
        if (!cards.some((card) => card.id === savedCard.id)) {
          await deleteCard(id, savedCard.id);
        }
      }
      router.navigate({ pathname: "/preview", params: { id } });
    } catch {
      setSaveError("We couldn’t save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Throws away unsaved edits and goes back to Preview.
  function cancel() {
    setConfirmingCancel(false);
    setCards(deck?.cards ?? []);
    setShowCardErrors(false);
    setSaveError("");
    router.navigate({ pathname: "/preview", params: { id } });
  }

  if (!deck) return <Text>Deck not found</Text>;

  return (
    <PageBackground>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.deckInfo}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckDescription}>{deck.description}</Text>
          </View>
          {/* Greyed out while editing, so unsaved changes can't be skipped. */}
          <Pressable style={styles.startStudyButton} disabled>
            <Text style={styles.startStudyText}>Start Studying</Text>
          </Pressable>
        </View>
        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            <TextInput
              value={card.term}
              style={styles.term}
              onChangeText={(text) => changeCardText(card.id, "term", text)}
            />
            <Text style={styles.cardLabel}>Term</Text>
            {showCardErrors && card.term === "" && (
              <Text style={styles.errorTermDef}>Please enter a term.</Text>
            )}
            <TextInput
              value={card.answer}
              style={styles.answer}
              onChangeText={(text) => changeCardText(card.id, "answer", text)}
              multiline
            />
            <Text style={styles.cardLabel}>Definition</Text>
            {showCardErrors && card.answer === "" && (
              <Text style={styles.errorTermDef}>
                Please enter a definition.
              </Text>
            )}
            <Pressable
              onPress={() => removeCard(card.id)}
              style={styles.deleteButton}
              accessibilityLabel="Delete card"
            >
              <TrashIcon color={ORANGE} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Sits on top of the page, so the buttons stay put while the cards scroll. */}
      <View style={styles.stickyButtons}>
        {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}
        <View style={styles.buttonRow}>
          <Pressable onPress={addNewCard} style={styles.addCardButton}>
            <Text style={styles.addCardText}>Add New Card</Text>
            <AddIcon color={ORANGE} />
          </Pressable>
          <Pressable
            onPress={editingCard}
            style={[styles.editingButton, isSaving && styles.buttonDisabled]}
            disabled={isSaving}
          >
            <Text style={styles.editingText}>Finish Editing</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setConfirmingCancel(true)}
          disabled={isSaving}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <Modal
        visible={confirmingCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingCancel(false)}
      >
        <View style={styles.cancelOverlay}>
          {/* intensity 10 is Figma's blur(2px) */}
          <BlurView
            intensity={10}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cancelBox} role="alertdialog" aria-modal>
            <Text style={styles.cancelTitle}>
              Are you sure you want to discard changes?
            </Text>
            <Pressable
              style={styles.keepEditingButton}
              onPress={() => setConfirmingCancel(false)}
            >
              <Text style={styles.keepEditingText}>No, keep editing</Text>
            </Pressable>
            <Pressable style={styles.discardButton} onPress={cancel}>
              <Text style={styles.discardText}>Yes, discard changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // not flex: 1, which would stop long decks from scrolling
    padding: 24,
    paddingTop: 84, // no header on this tab, so keep the content below the status bar
    paddingBottom: 140, // room to scroll the last card above the sticky buttons
  },
  // Wraps the title, description, and Start Studying button
  header: {
    // Layout
    width: "100%", // width: 265px → full width, capped at 265
    maxWidth: 265,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20, // with the first card's marginTop, 32 from the button like the mockup
  },
  // Wraps the title + description
  deckInfo: {
    // Layout
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
  },
  deckTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/H4)
    fontFamily: "Inter_600SemiBold", // font-family: Inter + font-weight: 600
    fontSize: 28,
    lineHeight: 34,
  },
  deckDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B1. Body)
    color: "#000",
    fontFamily: "Inter_400Regular", // font-family: Inter + font-weight: 400
    fontSize: 16,
    lineHeight: 24,
  },
  // Card styles match create.tsx
  card: {
    // Layout
    width: "100%", // width: 345px → full width inside the page padding
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    marginTop: 12,
    // Style
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ORANGE_100,
    backgroundColor: WHITE,
  },
  term: {
    // Layout
    height: 27,
    alignSelf: "stretch",
    paddingVertical: 0, // padding would cut off the text in a 27-tall box
    // Style
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_100,
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  answer: {
    // Layout
    minHeight: 27, // grows for long definitions, since this input is multiline
    alignSelf: "stretch",
    paddingVertical: 0,
    marginTop: 12,
    // Style
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_100,
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  cardLabel: {
    marginTop: 4,
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  errorTermDef: {
    marginTop: 5,
    color: ERROR_RED,
  },
  deleteButton: {
    alignSelf: "center",
    height: 24,
    padding: 2.5, // Figma's 4, minus the 1.5 border (React Native counts the border in the size)
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ORANGE,
    marginTop: 12,
  },
  startStudyButton: {
    // Layout
    alignSelf: "flex-start",
    height: 40,
    paddingVertical: 12, // padding: 12px 16px
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 12,
    backgroundColor: TEXT_GREY, // grey: disabled while editing (Figma icon-grey, #9EA2AE)
  },
  startStudyText: {
    // Typography (Button Font/Medium)
    color: WHITE, // white so it shows on the grey button
    textAlign: "center",
    fontFamily: "Inter_600SemiBold", // font-family: Inter + font-weight: 600
    fontSize: 14,
    lineHeight: 16,
  },
  stickyButtons: {
    // Layout
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    // Style
    backgroundColor: "rgba(255, 255, 255, 0.90)",
  },
  buttonRow: {
    // Layout
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
  },
  addCardButton: {
    flex: 1, // shares the row equally with Finish Editing
    flexDirection: "row",
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
  },
  addCardText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  editingText: {
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  editingButton: {
    flex: 1, // shares the row equally with Add New Card
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  buttonDisabled: {
    opacity: 0.5, // faded while saving
  },
  errorText: {
    color: ERROR_RED,
    textAlign: "center",
  },
  cancelText: {
    // Typography (Text Font/C1. Caption)
    color: TEXT_GREY,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  // The dimmed layer covering the whole screen behind the cancel box
  cancelOverlay: {
    // Layout
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 21,
    // Style
    backgroundColor: "rgba(20, 17, 15, 0.48)",
  },
  // The box holding the question and the two buttons
  cancelBox: {
    // Layout
    width: "100%",
    maxWidth: 350,
    padding: 24,
    alignItems: "flex-start",
    gap: 24,
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  cancelTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/S2. Subtitle)
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  keepEditingButton: {
    // Layout
    height: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  keepEditingText: {
    // Typography
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  discardButton: {
    // Layout
    height: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
  },
  discardText: {
    // Typography
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
});
