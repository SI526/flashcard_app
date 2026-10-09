import Flashcard from "@/components/Flashcard";
import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [savedCard, setSavedCard] = useState("");
  const handleAddCard = () => {
    setSavedCard("Card added!");
  };
  return (
    <View style={styles.container}>
      <Flashcard term="term" definition="definition"></Flashcard>
      <Button title="AddCard" onPress={handleAddCard} />

      <Text>{savedCard}</Text>
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
  },
});
