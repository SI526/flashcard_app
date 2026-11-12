import PageBackground from "@/components/PageBackground";
import StarButton from "@/components/StarButton";
import StatusBadge from "@/components/StatusBadge";
import { ORANGE, ORANGE_100, WHITE } from "@/constants/theme";
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
    <PageBackground>
      <ScrollView contentContainerStyle={ styles.container }>
        <View style={styles.header}>
          {/* Title and description on the left, status badge on the right */}
          <View style={styles.titleRow}>
            <View style={styles.deckInfo}>
              <Text style={styles.deckTitle}>{deck.title}</Text>
              <Text style={styles.deckDescription}>{deck.description}</Text>
            </View>
            <StatusBadge status={deck.status} />
          </View>
          {/* "Start Studying" (every card) and "Study starred" (only starred cards), side by side */}
          <View style={styles.studyOptions}>
            <Pressable
              role="button"
              style={({ pressed }) => [styles.startStudyButton, pressed && styles.pressed]}
              onPress={() => study("all")}
            >
              <Text style={styles.startStudyText}>Start Studying</Text>
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
              {/* The term with its star on the right */}
              <View style={styles.termRow}>
                <Text style={styles.term}>{card.term}</Text>
                <StarButton starred={card.starred} term={card.term} onPress={() => toggle(card)} />
              </View>
              <Text style={styles.answer}>{card.answer}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push({ pathname: "/editdeck", params: { id } })}
        >
          <Text style={styles.editText}>Edit Deck</Text>
        </Pressable>
      </ScrollView>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // not flex: 1, which would stop long decks from scrolling
    padding: 24,
    paddingTop: 84, // no header on this tab, so keep the content below the status bar
  },
  // Wraps the title row and the Start Studying button
  header: {
    // Layout
    alignItems: "flex-start",
    gap: 16,
  },
  // Title + description on the left, status badge on the right
  titleRow: {
    // Layout
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "stretch",
    gap: 12,
  },
  // Wraps the title + description
  deckInfo: {
    // Layout
    flex: 1, // takes the space left of the badge; long titles wrap
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  deckTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/H4)
    color: "#000",
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
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 24, // between the term and definition
    padding: 20,
    // Style
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ORANGE_100,
    backgroundColor: WHITE,
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
    flexShrink: 0,
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
    color: WHITE,
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
    color: WHITE,
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
    backgroundColor: ORANGE,
  },
});
