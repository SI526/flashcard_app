import { ORANGE } from "@/constants/theme";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Preview({}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);

  if (!deck) return <Text>Deck not found</Text>;

  return (
    <ScrollView contentContainerStyle={ styles.container }>
      <View style={styles.header}>
        <View style={styles.deckInfo}>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckDescription}>{deck.description}</Text>
        </View>
        <Pressable
          style={styles.startStudyButton}
          onPress={() => router.push({ pathname: "/study", params: { id } })}
        >
          <Text style={styles.startStudyText}>Start Studying</Text>
        </Pressable>
      </View>
      <View style={styles.cardList}>
        {deck.cards.map((card) => (
          <View key={card.id} style={styles.cards}>
            <Text style={styles.term}>{card.term}</Text>
            <Text style={styles.answer}>{card.answer}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.editButton}>
        <Text style={styles.editText}>Edit Deck</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // not flex: 1, which would stop long decks from scrolling
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  // Wraps the title, description, and Start Studying button
  header: {
    // Layout
    width: "100%", // width: 265px → full width, capped at 265
    maxWidth: 265,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
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
  // Wraps all the term cards
  cardList: {
    // Layout
    width: "100%", // width: 345px → full width inside the page padding
    flexDirection: "column",
    // align-items: flex-start left out so the cards stay full width
    gap: 16,
    marginTop: 30, // gap between the description section and the cards
  },
  cards: {
    // Layout
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 24,
    // flex: 1 0 0 left out: in a column it would stretch the card's height
    padding: 12,
    // Style
    borderWidth: 1, // border: 1px solid #D2D5DB
    borderColor: "#D2D5DB",
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
  term: {
    // Layout
    alignSelf: "stretch", // let long terms wrap inside the card instead of getting cut off
    // Typography (Text Font/B2. Body)
    color: "#000",
    fontFamily: "Inter_500Medium", // font-family: Inter + font-weight: 500
    fontSize: 16,
    lineHeight: 24,
  },
  answer: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/C1. Caption)
    color: "#000",
    fontFamily: "Inter_400Regular", // font-family: Inter + font-weight: 400
    fontSize: 12,
    lineHeight: 16,
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
    backgroundColor: ORANGE,
  },
  startStudyText: {
    // Typography (Button Font/Medium)
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold", // font-family: Inter + font-weight: 600
    fontSize: 14,
    lineHeight: 16,
  },
  buttonText: {
    textAlign: "center",
  },
  editText: {
    // Typography (Button Font/Medium)
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold", // font-family: Inter + font-weight: 600
    fontSize: 14,
    lineHeight: 16,
  },
  editButton: {
    // Layout
    alignSelf: "center", // display: inline-flex → only as wide as its content, centered like the mockup
    height: 40,
    paddingVertical: 12, // padding: 12px 16px
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    // Style
    borderRadius: 12,
    borderWidth: 1.5, // border: 1.5px solid #C45100
    borderColor: ORANGE,
  },
});
