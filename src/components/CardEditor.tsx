import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type CardEditorProps = {
  definition: string;
  onChange: (definition: string) => void;
  onDelete: () => void;
  disabled?: boolean;
};

// Edit mode for a practice card: the definition becomes editable and a delete
// button sits in the bottom-right corner. Save and Cancel live with the screen,
// which owns the pending changes.
export default function CardEditor({ definition, onChange, onDelete, disabled }: CardEditorProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.banner}>You are in editing mode.</Text>

      <TextInput
        multiline
        autoFocus
        editable={!disabled}
        accessibilityLabel="Definition"
        placeholder="Definition"
        value={definition}
        onChangeText={onChange}
        style={styles.input}
      />

      <Pressable
        role="button"
        accessibilityLabel="Delete card"
        onPress={onDelete}
        disabled={disabled}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.deleteButtonPressed,
          disabled && styles.disabled,
        ]}
      >
        <SymbolView name={{ ios: "trash", android: "delete", web: "delete" }} size={18} tintColor="#C62828" />
      </Pressable>
    </View>
  );
}

// Same size as the practice card (see Flashcard.tsx), with a heavier border to
// show it's in editing mode.
const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 345 / 330,
    gap: 10,
    padding: 16,
    paddingBottom: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  banner: {
    color: "#000000",
    fontSize: 13,
    textAlign: "center",
  },
  input: {
    flex: 1,
    color: "#000000",
    fontSize: 17,
    textAlign: "center",
    textAlignVertical: "top",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#F7F7F7",
  },
  deleteButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C62828",
  },
  deleteButtonPressed: {
    backgroundColor: "#FDECEA",
  },
  disabled: {
    opacity: 0.4,
  },
});
