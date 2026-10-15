import { Button, Text, View, StyleSheet, Pressable } from "react-native";
import {useState} from 'react';

export default function SubjectSelector() {

  return (
    <Pressable style={styles.container}>
      <Text>Subject</Text>
    </Pressable>
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
