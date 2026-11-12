import PageBackground from "@/components/PageBackground";
import { ORANGE, TEXT_BLACK, WHITE } from "@/constants/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <PageBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.introText}>Create your first deck to get started!</Text>
          <View style={styles.buttons}>
            <Pressable
              style={styles.buttonContainer}
              onPress={() => router.navigate("/create")}
            >
              <Text style={styles.buttonText}>Create New Deck</Text>
            </Pressable>
            <Pressable
              style={styles.buttonContainer}
              onPress={() => router.navigate("/library")}
            >
              <Text style={styles.buttonText}>Your Library</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  content: {
    width: "100%",
    maxWidth: 337,
    flexDirection: "column",
    alignItems: "center",
    gap: 72,
  },
  buttons: {
    alignItems: "center",
    gap: 16,
  },
  buttonContainer: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: ORANGE,
  },
  buttonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "600",
  },
  introText: {
    fontSize: 28,
    alignItems: "center",
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    lineHeight: 34,
  }
});
