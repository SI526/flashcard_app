import { useDecks } from "@/store/decks";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LibraryScreen() {
  const { decks } = useDecks();
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.libraryText}>Your Library</Text>
      {decks.length === 0 && <Text>No decks yet</Text>}

      {decks.map((deck) => (
        <Pressable
          key={deck.id}
          onPress={() =>
            router.push({ pathname: "/preview", params: { id: deck.id } })
          }
        >
          <View style={styles.decks}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckDescription}>{deck.description}</Text>
            <Text>{deck.cards.length} cards</Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        style={styles.buttonContainer}
        onPress={() => router.navigate("/create")}
      >
        <Text>Create New Deck</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  libraryText: {
    fontSize: 36,
    fontWeight: "500",
  },
  decks: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  deckTitle: {
    fontSize: 36,
    fontWeight: "500",
  },
  deckDescription: {
    marginTop: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
