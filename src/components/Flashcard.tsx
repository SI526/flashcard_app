import { useState } from "react";
import {
    StyleSheet,
    TextInput,
    View
} from "react-native";

export default function Flashcard({ onAdd }) {
  const [flip, setFlip] = useState(false);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");

  const handleAdd = (term, definition) => {
    onAdd({ term, definition });
    setTerm("");
    setDefinition("");
  };
  // onPress = {() => setFlip(!flip)}
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TextInput
          style={styles.textInput}
          value={term}
          onChangeText={setTerm}
          placeholder="Enter term"
          autoCapitalize="words"
          returnKeyType="done"
        />
        <TextInput
          style={styles.textInput}
          value={definition}
          onChangeText={setDefinition}
          placeholder="Enter definition"
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>
      {/* <Pressable
        style={styles.container} 
        onPress = {() => setFlip(!flip)}>
        <Text style={styles.text}>
          {flip ? definition : term}
        </Text>
      </Pressable> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    borderRadius: 8,
    shadowOpacity: 0.2,
    shadowRadius: 1,
    borderColor: "#00702F",
    borderWidth: 10,
    height: 100,
    width: "100%",
    paddingTop: 24,
    gap: 24,
    maxHeight: 100,
  },
  text: {
    padding: 25,
    fontSize: 24,
    color: "#FFF",
  },
  textInput: {
    backgroundColor: "#242ae7",
    borderRadius: 8,
  },
});
