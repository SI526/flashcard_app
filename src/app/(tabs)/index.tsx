import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.introText}>Create your first deck to get started</Text>
      <Pressable
        style={styles.buttonContainer}
        onPress={() => router.navigate("/create")}
      >
        <Text>Create New Deck</Text>
      </Pressable>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    marginTop: 16,
    borderWidth: 1, 
    borderColor: "#000", 
    borderRadius: 8,
    padding: 10,
  },
  introText: {
    fontSize: 25,
    alignItems: "center",
  }
});
