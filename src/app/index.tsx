import { Button, Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>
        Think of index.tsx like the index.html in HTML. Since we're using React
        Native, we don't need a separate CSS file. Styling can be written directly
        in index.tsx using StyleSheet. Check it out in index.tsx! 
        Edit src/app/index.tsx to edit this screen.
      </Text>
      <View style={styles.buttonContainer}>
        <Button title="Click this button" onPress={() => {}} />
      </View>
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
