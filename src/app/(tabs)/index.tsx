import { ORANGE } from "@/constants/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.introText}>Create your first deck to get started!</Text>
        <Pressable
          style={styles.buttonContainer}
          onPress={() => router.navigate("/create")}
        >
          <Text style={styles.buttonText}>Create New Deck</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  content: {
    width: "100%",
    maxWidth: 337,
    flexDirection: "column",
    alignItems: "center",
    gap: 72,
  },
  buttonContainer: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: ORANGE,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  introText: {
    fontSize: 28,
    alignItems: "center",
    color: "#131927",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    lineHeight: 34,
  }
});
