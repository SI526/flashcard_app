import { Button, Text, View, StyleSheet, Pressable } from "react-native";
import {useState} from 'react';

export default function DeckForm() {

  return (
    <View style={styles.container}>
        {/* deck name */}
        {/* deck custom subject */}
        {/* deck description */}
        {/* flashcard state (term vs definition) */}
        {/* add card button */}
        {/* save deck button */}
        {/* error handling later */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    padding: 25,
    fontSize: 24,
    color: "#FFF"
  }
});