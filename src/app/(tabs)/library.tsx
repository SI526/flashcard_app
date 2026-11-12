import PageBackground from "@/components/PageBackground";
import StatusBadge from "@/components/StatusBadge";
import { ORANGE, ORANGE_100, WHITE } from "@/constants/theme";
import { useDecks } from "@/store/decks";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LibraryScreen() {
  const { decks } = useDecks();
  return (
    <PageBackground>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 84 }}>
        {/* Title and Create New Deck button at the top */}
        <View style={styles.header}>
          <Text style={styles.libraryText}>Your Library</Text>
          <Pressable
            style={styles.buttonContainer}
            onPress={() => router.navigate("/create")}
          >
            <Text style={styles.buttonText}>Create New Deck</Text>
          </Pressable>
        </View>
        <View style={styles.deckList}>
        {decks.length === 0 && <Text>No decks yet</Text>}

        {decks.map((deck) => (
          <Pressable
            key={deck.id}
            onPress={() =>
              router.push({ pathname: "/preview", params: { id: deck.id } })
            }
          >
            <View style={styles.decks}>
              {/* Deck name on top, with the description and card count below */}
              <View style={styles.deckInfo}>
                <Text style={styles.deckTitle}>{deck.title}</Text>
                <View style={styles.deckDetails}>
                  <Text style={styles.deckDetail}>{deck.description}</Text>
                  <Text style={styles.deckDetail}>
                    {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                  </Text>
                </View>
              </View>
              <StatusBadge status={deck.status} />
            </View>
          </Pressable>
        ))}
        </View>
      </ScrollView>
    </PageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Wraps the Your Library title and the Create New Deck button
  header: {
    // Layout
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 36, // space between the button and the first deck
  },
  // Wraps all the deck cards
  deckList: {
    // Layout (alignItems left at the default stretch, so the cards stay full width)
    alignSelf: "stretch",
    gap: 12,
  },
  libraryText: {
    // Typography (Text Font/H4)
    color: "#000000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  decks: {
    // Layout: deck info on the left, status badge in the top-right corner
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "stretch",
    padding: 20,
    justifyContent: "center",
    gap: 10,
    // Style
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ORANGE_100,
    backgroundColor: WHITE,
  },
  // Wraps the deck name, description and card count
  deckInfo: {
    // Layout
    flex: 1, // takes the space left of the badge; long names wrap
    alignItems: "flex-start",
    gap: 24,
  },
  deckTitle: {
    // Typography (Text Font/H5)
    color: "#000000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 28,
  },
  // Wraps the description and card count
  deckDetails: {
    // Layout
    gap: 4,
  },
  deckDetail: {
    // Typography (Text Font/C1. Caption), for the description and card count
    color: "rgba(0, 0, 0, 0.70)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  buttonContainer: {
    // Layout
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  buttonText: {
    // Typography
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
});
