import { ORANGE } from "@/constants/theme";
import { AddIcon, CheckIcon, TrashIcon } from "@/components/Icons";
import { useDecks } from "@/store/decks";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  const { addDeck } = useDecks();

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
      setSaveError("");
      // The deck is saved, so clear the form for the next new deck.
      setDeckTitle("");
      setDeckDescription("");
      setCards([{ id: 1, term: "", answer: "" }]); // same as the starting form
      setShowCardErrors(false);
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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.deckContainer}>
        <View style={styles.field}>
          <View
            style={[styles.titleGroup, titleError !== "" && styles.groupError]}
          >
            <TextInput
              placeholder="Title"
              placeholderTextColor="#9EA2AE"
              value={deckTitle}
              onChangeText={setDeckTitle}
              style={styles.deckTitle}
            />
          </View>
          {titleError !== "" ? (
            <Text style={styles.errorText}>{titleError}</Text>
          ) : (
            <Text style={styles.helperText}>Add name of deck!</Text>
          )}
        </View>

        <View style={styles.field}>
          <View
            style={[
              styles.descriptionGroup,
              descriptionError !== "" && styles.groupError,
            ]}
          >
            <TextInput
              placeholder="Add a description..."
              placeholderTextColor="#9EA2AE"
              value={deckDescription}
              onChangeText={setDeckDescription}
              style={styles.deckDescription}
            />
          </View>
          {descriptionError !== "" ? (
            <Text style={styles.errorText}>{descriptionError}</Text>
          ) : (
            <Text style={styles.helperText}>
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
          <CheckIcon color="#FFFFFF" />
        </Pressable>
        {cardCountError !== "" && (
          <Text style={styles.errorText}>{cardCountError}</Text>
        )}
        {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
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
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  field: {
    gap: 8,
  },
  groupError: {
    borderColor: "#E21D1D",
  },
  helperText: {
    color: "#9EA2AE",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
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
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D2D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 16,
  },
  term: {
    borderBottomWidth: 1,
    borderBottomColor: "#D2D5DB",
    paddingVertical: 8,
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  answer: {
    borderBottomWidth: 1,
    borderBottomColor: "#D2D5DB",
    paddingVertical: 8,
    marginTop: 12,
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  cardLabel: {
    marginTop: 4,
    color: "#131927",
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
    color: "#FFFFFF",
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
    color: "#e21d1d",
  },
  errorTermDef: {
    marginTop: 5,
    color: "#e21d1d",
  },
});
