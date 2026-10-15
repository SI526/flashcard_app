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
  function completeDeck() {
    if (!handleErrors()) {
      return;
    }
    const id = addDeck(deckTitle, deckDescription, cards);
    router.replace({ pathname: "/preview", params: { id } });
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
      <TextInput
        placeholder="Title"
        value={deckTitle}
        onChangeText={setDeckTitle}
        style={styles.deckTitle}
      />
      <Text style={styles.errorText}>{titleError}</Text>

      <TextInput
        placeholder="Description"
        value={deckDescription}
        onChangeText={setDeckDescription}
        style={styles.deckDescription}
      />
      <Text style={styles.errorText}>{descriptionError}</Text>

      {cards.map((card) => (
        <View key={card.id} style={styles.card}>
          <TextInput
            placeholder="Term"
            value={card.term}
            style={styles.term}
            onChangeText={(text) => changeCardText(card.id, "term", text)}
          />
          {showCardErrors && card.term === "" && (
            <Text style={styles.errorTermDef}>Please enter a term.</Text>
          )}
          <TextInput
            placeholder="Definition"
            value={card.answer}
            style={styles.answer}
            onChangeText={(text) => changeCardText(card.id, "answer", text)}
            multiline
          />
          {showCardErrors && card.answer === "" && (
            <Text style={styles.errorTermDef}>Please enter a definition.</Text>
          )}
          <Pressable
            onPress={() => deleteCard(card.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.buttons}>
        <Pressable onPress={addCard} style={styles.addCardButton}>
          <Text style={styles.buttonText}>Add New Card</Text>
        </Pressable>

        <Pressable onPress={completeDeck} style={styles.addCardButton}>
          <Text style={styles.buttonText}>Complete Card Deck</Text>
        </Pressable>
        <Text style={styles.errorText}>{cardCountError}</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  deckTitle: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 16,
    marginBottom: 16,
    fontSize: 25,
    fontWeight: "700",
    marginTop: 5,
  },
  deckDescription: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 16,
    marginBottom: 16,
    fontSize: 15,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  term: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  answer: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  addCardButton: {
    width: "auto",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 48,
    padding: 10,
  },
  deleteButton: {
    alignSelf: "flex-end",
    // width: "auto",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 48,
    padding: 10,
    marginTop: 15,
  },
  buttons: {
    flex: 1,
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
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
