import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Preview({}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);

  if (!deck) return <Text>Deck not found</Text>;

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.deckTitle}>{deck.title}</Text>
      <Text style={styles.deckDescription}>{deck.description}</Text>
      <Pressable 
        style={styles.startStudyButton}
        onPress={() => router.push({ pathname: "/study", params: { id } })}
      >
        <Text style={styles.buttonText}>Start Studying</Text>
      </Pressable>
      {deck.cards.map((card) => (
        <View key={card.id} style={styles.cards}>
          <Text style={styles.term}>{card.term}</Text>
          <Text style={styles.answer}>{card.answer}</Text>
        </View>
      ))}
      <Pressable style={styles.editButton}>
        <Text style={styles.buttonText}>Edit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deckTitle: {
    // borderWidth: 1,
    // borderColor: "#000",
    // borderRadius: 8,
    fontSize: 36,
    fontWeight: "500",
  },
  deckDescription: {
    // borderWidth: 1,
    // borderColor: "#000",
    // borderRadius: 8,
    fontSize: 16,
    marginTop: 12,
  },
  cards: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  term: {
    fontSize: 16,
    marginBottom: 10,
  },
  answer: {
    fontSize: 12,
  },
  startStudyButton: {
    alignSelf: "flex-start",
    // width: "auto",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 48,
    padding: 10,
    marginTop: 15,
  },
  buttonText: {
    textAlign: "center",
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 48,
    alignItems: "center",
    marginTop: 15,
    padding: 10,
  },
});
