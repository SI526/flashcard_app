import { ORANGE } from "@/constants/theme";
import { SignedInLockIcon } from "@/components/Icons";
import { useAuth } from "@/store/auth";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const { logOut, name, email } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // The button is disabled and shows a spinner while this runs. Once logged out,
  // Stack.Protected sends the user to Welcome; resetting the state brings the button
  // back if something goes wrong.
  async function handleLogOut() {
    setIsLoggingOut(true);
    await logOut();
    setIsLoggingOut(false);
  }

  // First letter of the name, shown in the orange circle.
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <Text style={styles.account}>Account</Text>
      <Text style={styles.title}>My profile</Text>
      <Text style={styles.description}>View your account and securely end your session.</Text>
      <View style={styles.profileCredentials}>
        <View style={styles.initialCircle}>
          <Text style={styles.initialText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <View style={styles.signedInContained}>
        <SignedInLockIcon color="#0095FF" />
        <View style={styles.signedInTextGroup}>
          <Text style={styles.signedInText}>Signed in on this device</Text>
          <Text style={styles.syncedText}>Your study progress is synced.</Text>
        </View>
      </View>
      <View style={styles.logOutGroup}>
        <Pressable
          style={[styles.logOutButton, isLoggingOut && styles.logOutButtonLoading]}
          onPress={handleLogOut}
          disabled={isLoggingOut}
        >
          {isLoggingOut && <ActivityIndicator color="#FFFFFF" />}
          <Text style={[styles.logOutText, isLoggingOut && styles.logOutTextLoading]}>
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Text>
        </Pressable>
        <Text style={styles.logOutNote}>You&apos;ll need to log in again to access your decks.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Layout
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    // Style
    backgroundColor: "#FFFFFF",
  },
  account: {
    // Typography
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    // Typography
    marginTop: 12,
    color: "#1F1F1F",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    // Typography
    marginTop: 16,
    color: "#6B6B6B",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  profileCredentials: {
    // Layout
    alignItems: "center",
    marginTop: 28,
  },
  initialCircle: {
    // Layout
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 40, // half the width makes a circle
    backgroundColor: ORANGE,
  },
  initialText: {
    // Typography
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 40,
    lineHeight: 48,
  },
  name: {
    // Typography
    marginTop: 20,
    color: "#131927",
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
  },
  email: {
    // Typography
    marginTop: 8,
    color: "#131927",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  signedInContained: {
    // Layout: lock on the left, text stacked on the right
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    marginTop: 28,
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0095FF",
    backgroundColor: "#E5F4FF",
  },
  signedInTextGroup: {
    // Layout
    flex: 1,
    gap: 4,
  },
  signedInText: {
    // Typography
    color: "#131927",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  syncedText: {
    // Typography
    color: "#6B6B6B",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  logOutGroup: {
    // Layout: pushed down toward the bottom like the mockup
    marginTop: "auto",
    marginBottom: 100,
    gap: 16,
  },
  logOutButton: {
    // Layout
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
  },
  logOutButtonLoading: {
    // Style
    borderColor: "#652A06",
    backgroundColor: "#652A06", // dark brown from the mockup (estimated)
  },
  logOutTextLoading: {
    // Typography
    color: "#FFFFFF",
  },
  logOutText: {
    // Typography
    color: ORANGE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  logOutNote: {
    // Typography
    color: "#6B6B6B",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
