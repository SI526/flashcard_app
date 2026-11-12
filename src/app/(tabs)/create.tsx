import PageBackground from "@/components/PageBackground";
import { ERROR_RED, ORANGE, ORANGE_100, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import { AddIcon, CheckIcon, TrashIcon } from "@/components/Icons";
import { useDecks } from "@/store/decks";
import { setLeaveGuard } from "@/utils/leaveGuard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateScreen() {
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [cards, setCards] = useState([{ id: 1, term: "", answer: "" }]);
  const [showCardErrors, setShowCardErrors] = useState(false);
  const [cardCountError, setCardCountError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [saveError, setSaveError] = useState("");
  // Which box the user is typing in, so it gets the orange border (like Edit Profile's name).
  const [focusedField, setFocusedField] = useState<"title" | "description" | null>(null);
  const { addDeck } = useDecks();

  // Something has been typed (or cards added/removed) since the form was empty.
  const hasChanges =
    deckTitle !== "" ||
    deckDescription !== "" ||
    cards.length !== 1 ||
    cards.some((card) => card.term !== "" || card.answer !== "");

  // "Discard this deck?" popup, shown when a tab is tapped with an unfinished deck.
  // `pendingLeave` is the tab switch to finish if they choose to discard.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  // While there are changes, the tab bar asks this screen before leaving it.
  useEffect(() => {
    if (!hasChanges) return;
    return setLeaveGuard("create", (leave) => {
      setPendingLeave(() => leave); // a function in state needs the () => wrapper
      return true; // stop the tab switch; the popup decides
    });
  }, [hasChanges]);

  // Empties the form back to how it starts.
  function clearForm() {
    setDeckTitle("");
    setDeckDescription("");
    setCards([{ id: 1, term: "", answer: "" }]); // same as the starting form
    setShowCardErrors(false);
    setTitleError("");
    setDescriptionError("");
    setCardCountError("");
    setSaveError("");
  }

  // "Discard deck": clear the form, then go to the tab they tapped.
  function discardAndLeave() {
    const leave = pendingLeave;
    setPendingLeave(null);
    clearForm();
    leave?.();
  }

  function changeCardText(id: number, field: "term" | "answer", text: string) {
    setCards((previousCards) =>
      previousCards.map((card) =>
        card.id === id ? { ...card, [field]: text } : card,
      ),
    );
  }
  function addCard() {
    setCards((previousCards) => [
      ...previousCards,
      { id: Date.now(), term: "", answer: "" },
    ]);
  }
  function deleteCard(id: number) {
    setCards((previousCards) => previousCards.filter((card) => card.id !== id));
  }
  async function completeDeck() {
    if (!handleErrors()) {
      return;
    }
    // Saving to Supabase takes a moment, so wait for it. If it fails
    // (e.g. no internet), show the message instead of leaving the page.
    try {
      const id = await addDeck(deckTitle, deckDescription, cards);
      // The deck is saved, so clear the form for the next new deck.
      clearForm();
      router.push({ pathname: "/preview", params: { id } });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Couldn't save the deck.",
      );
    }
  }

  function handleErrors() {
    let isValid = true;

    if (deckTitle == "") {
      setTitleError("Please enter a deck title.");
      isValid = false;
    } else {
      setTitleError("");
    }
    if (deckDescription == "") {
      setDescriptionError("Please enter a deck description.");
      isValid = false;
    } else {
      setDescriptionError("");
    }
    const hasEmptyCard = cards.some(
      (card) => card.term === "" || card.answer === "",
    );
    if (hasEmptyCard) {
      isValid = false;
    }
    if (cards.length === 0) {
      setCardCountError(
        "Please add at least one flashcard before creating the deck.",
      );
      isValid = false;
    } else {
      setCardCountError("");
    }
    setShowCardErrors(true);
    return isValid;
  }
  return (
    <PageBackground>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.deckContainer}>
          <View style={styles.field}>
            <View
              style={[
                styles.titleGroup,
                focusedField === "title" && styles.groupFocused,
                titleError !== "" && styles.groupError,
              ]}
            >
              <TextInput
                placeholder="Title"
                placeholderTextColor={TEXT_GREY}
                value={deckTitle}
                onChangeText={setDeckTitle}
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
                style={styles.deckTitle}
              />
            </View>
            {titleError !== "" ? (
              <Text style={styles.errorText}>{titleError}</Text>
            ) : (
              <Text style={[styles.helperText, focusedField === "title" && styles.helperTextFocused]}>
                Add name of deck!
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <View
              style={[
                styles.descriptionGroup,
                focusedField === "description" && styles.groupFocused,
                descriptionError !== "" && styles.groupError,
              ]}
            >
              <TextInput
                placeholder="Add a description..."
                placeholderTextColor={TEXT_GREY}
                value={deckDescription}
                onChangeText={setDeckDescription}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
                style={styles.deckDescription}
              />
            </View>
            {descriptionError !== "" ? (
              <Text style={styles.errorText}>{descriptionError}</Text>
            ) : (
              <Text
                style={[styles.helperText, focusedField === "description" && styles.helperTextFocused]}
              >
                Add a short description of study materials.
              </Text>
            )}
          </View>
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
              <Text style={styles.errorTermDef}>Please enter a definition.</Text>
            )}
            <Pressable
              onPress={() => deleteCard(card.id)}
              style={styles.deleteButton}
              accessibilityLabel="Delete card"
            >
              <TrashIcon color={ORANGE} />
            </Pressable>
          </View>
        ))}
        <View style={styles.buttons}>
          <Pressable onPress={addCard} style={styles.addCardButton}>
            <Text style={styles.addCardText}>Add New Card</Text>
            <AddIcon color={ORANGE} />
          </Pressable>

          <Pressable onPress={completeDeck} style={styles.completeDeckButton}>
            <Text style={styles.buttonText}>Complete Deck</Text>
            <CheckIcon color={WHITE} />
          </Pressable>
          {cardCountError !== "" && (
            <Text style={styles.errorText}>{cardCountError}</Text>
          )}
          {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}
        </View>
      </ScrollView>

      {/* Shown when a tab is tapped with an unfinished deck (same look as Edit Profile's popup) */}
      <Modal
        visible={pendingLeave !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingLeave(null)}
      >
        <View style={styles.leaveOverlay}>
          <View style={styles.leaveBox} role="alertdialog" aria-modal>
            <View style={styles.leaveTextGroup}>
              <Text style={styles.leaveTitle}>Discard this deck?</Text>
              <Text style={styles.leaveDescription}>
                You have an unfinished deck. If you leave now, it won’t be saved.
              </Text>
            </View>
            <View style={styles.leaveButtons}>
              <Pressable style={styles.keepEditingButton} onPress={() => setPendingLeave(null)}>
                <Text style={styles.keepEditingText}>Keep editing</Text>
              </Pressable>
              <Pressable style={styles.discardButton} onPress={discardAndLeave}>
                <Text style={styles.discardText}>Discard deck</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 84, // no header on this tab, so keep the form below the status bar
  },
  deckContainer: {
    width: "100%",
    flexDirection: "column",
    gap: 16,
    marginBottom: 28,
  },
  titleGroup: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EA",
    backgroundColor: "#F9FAFB",
  },
  deckTitle: {
    // Layout
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    padding: 0,
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  field: {
    gap: 8,
  },
  // While typing: orange border like Edit Profile's name box; the grey background stays.
  groupFocused: {
    borderColor: ORANGE, // Primary-500
  },
  // Listed after groupFocused, so a red error border shows even while typing.
  groupError: {
    borderColor: ERROR_RED,
  },
  helperText: {
    color: TEXT_GREY,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // Helper text turns orange with its box while typing
  helperTextFocused: {
    color: ORANGE,
  },
  descriptionGroup: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EA",
    backgroundColor: "#F9FAFB",
  },
  deckDescription: {
    // Layout
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    padding: 0,
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  // Card styles match editdeck.tsx
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
  addCardButton: {
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
  completeDeckButton: {
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
    backgroundColor: ORANGE,
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
  buttons: {
    flex: 1,
    gap: 16,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: {
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  addCardText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  errorText: {
    marginBottom: 5,
    color: ERROR_RED,
  },
  errorTermDef: {
    marginTop: 5,
    color: ERROR_RED,
  },
  // ─── "Discard this deck?" popup (same styles as Edit Profile's "Save changes?") ───
  // Dark see-through layer behind the popup
  leaveOverlay: {
    // Layout
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    // Style
    backgroundColor: "rgba(20, 17, 15, 0.48)",
  },
  leaveBox: {
    // Layout
    width: "100%", // same width as the page's content: the overlay has the page's 24px side padding
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 20,
    paddingVertical: 28, // padding: 28px 24px
    paddingHorizontal: 24,
    // Style
    borderRadius: 16,
    backgroundColor: WHITE,
    boxShadow: "0 8px 32px 0 rgba(19, 25, 39, 0.19)",
  },
  leaveTextGroup: {
    alignSelf: "stretch",
    gap: 8,
  },
  leaveTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/S2. Subtitle)
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  leaveDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  leaveButtons: {
    alignSelf: "stretch",
    gap: 12,
  },
  // Keep editing: solid orange (the main choice)
  keepEditingButton: {
    // Layout
    paddingVertical: 14, // padding: 14px 20px
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  keepEditingText: {
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  // Discard deck: orange outline
  discardButton: {
    // Layout
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: WHITE,
  },
  discardText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
});
