import { Button, Text, View, StyleSheet, Pressable } from "react-native";
import {useState} from 'react';

export default function SubjectSelector({subject}) {

  return (
    <Pressable style={styles.container}>
    
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
