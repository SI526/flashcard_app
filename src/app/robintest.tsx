import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SUBJECTS = ["Biology", "Chemistry", "History", "Math"];

type Deck = { name: string; subject: string; description: string };

export default function RobinTest() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [description, setDescription] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);

  const usingCustomSubject = subject === "Custom";
  const deckSubject = usingCustomSubject ? customSubject.trim() : subject;

  function saveDeck() {
    if (!name.trim() || !deckSubject || !description.trim()) {
      Alert.alert(
        "Complete the deck",
        "Please add a name, subject, and description.",
      );
      return;
    }
    setDeck({
      name: name.trim(),
      subject: deckSubject,
      description: description.trim(),
    });
    setIsCreating(false);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Hello, world!</Text>

      {!isCreating ? (
        <>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setIsCreating(true)}
          >
            <Text style={styles.primaryButtonText}>Create New Deck</Text>
          </Pressable>
          {deck && (
            <View style={styles.deckCard}>
              <Text style={styles.savedLabel}>DECK CREATED</Text>
              <Text style={styles.deckName}>{deck.name}</Text>
              <Text style={styles.deckSubject}>{deck.subject}</Text>
              <Text style={styles.deckDescription}>{deck.description}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create a new deck</Text>
          <Text style={styles.label}>Deck name</Text>
          <TextInput
            accessibilityLabel="Deck name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Midterm vocabulary"
          />

          <Text style={styles.label}>Subject</Text>
          <View style={styles.subjectList}>
            {[...SUBJECTS].map((option) => (
              <Pressable
                key={option}
                onPress={() => setSubject(option)}
                style={[
                  styles.subjectButton,
                  subject === option && styles.subjectButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.subjectButtonText,
                    subject === option && styles.subjectButtonTextSelected,
                  ]}
                >
                  {option === "Custom" ? "Other / custom" : option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            accessibilityLabel="Deck description"
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="What material does this deck cover?"
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setIsCreating(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={saveDeck}>
              <Text style={styles.primaryButtonText}>Save Deck</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  heading: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  form: { gap: 9 },
  formTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  label: { color: "#1f2937", fontSize: 15, fontWeight: "600", marginTop: 8 },
  input: {
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  descriptionInput: { minHeight: 92 },
  subjectList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectButton: {
    borderColor: "#94a3b8",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectButtonSelected: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  subjectButtonText: { color: "#334155" },
  subjectButtonTextSelected: { color: "#1d4ed8", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#94a3b8",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  cancelButtonText: { color: "#334155", fontSize: 16, fontWeight: "600" },
  deckCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    marginTop: 24,
    padding: 18,
  },
  savedLabel: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  deckName: { fontSize: 21, fontWeight: "700", marginTop: 5 },
  deckSubject: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  deckDescription: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
});
