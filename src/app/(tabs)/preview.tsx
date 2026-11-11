import StarButton from "@/components/StarButton";
import { ORANGE } from "@/constants/theme";
import { STAR_ERROR, useStarToggle } from "@/hooks/useStarToggle";
import { useDecks } from "@/store/decks";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Preview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDeck } = useDecks();
  const deck = getDeck(id);
  const { toggle, failed } = useStarToggle(id);

  if (!deck) return <Text>Deck not found</Text>;

  const starredCount = deck.cards.filter((card) => card.starred).length;

  // "Study starred" only includes the cards starred right now; Study reads
  // that list once, when the session starts.
  const study = (mode: "all" | "starred") =>
    router.push({ pathname: "/study", params: mode === "starred" ? { id, mode } : { id } });

  return (
    <ScrollView contentContainerStyle={ styles.container }>
      <View style={styles.header}>
        <View style={styles.deckInfo}>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckDescription}>{deck.description}</Text>
        </View>
        <View style={styles.studyOptions}>
          <Pressable
            role="button"
            style={({ pressed }) => [styles.startStudyButton, pressed && styles.pressed]}
            onPress={() => study("all")}
          >
            <Text style={styles.startStudyText}>Study all cards</Text>
          </Pressable>
          <Pressable
            role="button"
            disabled={starredCount === 0}
            accessibilityHint={
              starredCount === 0 ? undefined : `Studies your ${starredCount} starred cards`
            }
            style={({ pressed }) => [
              styles.studyStarredButton,
              pressed && styles.pressed,
              starredCount === 0 && styles.disabled,
            ]}
            onPress={() => study("starred")}
          >
            <Text style={styles.studyStarredText}>Study starred</Text>
          </Pressable>
        </View>
        {starredCount === 0 && (
          <Text style={styles.guidance}>Star terms below to create a focused study session.</Text>
        )}
      </View>
      {failed && (
        <Text role="alert" style={styles.errorText}>
          {STAR_ERROR}
        </Text>
      )}
      <View style={styles.cardList}>
        {deck.cards.map((card) => (
          <View key={card.id} style={styles.cards}>
            <View style={styles.termRow}>
              <Text style={styles.term}>{card.term}</Text>
              <StarButton starred={card.starred} term={card.term} onPress={() => toggle(card)} />
            </View>
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
    width: "100%", // full width, capped at 345 so both study buttons fit on one line
    maxWidth: 345,
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
  // The term with its star on the right.
  termRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  term: {
    // Layout
    flex: 1, // let long terms wrap beside the star instead of getting cut off
    paddingTop: 6, // lines the first line up with the middle of the star
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
  // "Study all cards" and "Study starred", side by side.
  studyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  studyStarredButton: {
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
  },
  studyStarredText: {
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  guidance: {
    color: "#646A75",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    marginTop: 16,
    color: "#C62828",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
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
