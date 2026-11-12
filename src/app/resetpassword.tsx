import PageBackground from "@/components/PageBackground";
import { EnvelopeIcon } from "@/components/Icons";
import { ERROR_RED, ORANGE, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import { useAuth } from "@/store/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Something@something.something, with no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPassword({}) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  // Checked on every keystroke. No error while the field is still empty.
  const emailFormatError =
    email === "" || EMAIL_PATTERN.test(email)
      ? ""
      : "Please enter a valid email address.";
  // The button only works once both fields are filled in, the email is valid, and we're not already logging in.
  const canSubmit =
    email !== "" && emailFormatError === "" && !isSubmitting;
  const errorMessage = emailError !== "" ? emailError : emailFormatError;

  function handleErrors() {
    let isValid = true;

    if (email === "") {
      setEmailError("Please enter your email address.");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    return isValid;
  }

  return (
    <PageBackground>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconCircle}>
          <EnvelopeIcon color={ORANGE} />
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.reset}>Password help</Text>
          <Text style={styles.resetTitle}>Reset your password</Text>
          <Text style={styles.resetDescription}>
            Enter the email linked to your account and we&apos;ll send you a secure reset link.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={TEXT_GREY}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />
            {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          {/* TODO: send the reset email once the set-new-password page is planned. */}
          <Pressable
            style={[styles.sendLinkButton, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
          >
            <Text style={styles.sendLinkText}>Send reset link</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    // Layout
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16, // the navigation header already fills most of Figma's 84
    paddingBottom: 84,
    gap: 24,
  },
  iconCircle: {
    // Layout
    width: 58,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 29,
    backgroundColor: "#FFF1E8",
  },
  textGroup: {
    // Layout
    gap: 8,
  },
  reset: {
    // Typography
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  resetTitle: {
    // Typography
    color: "#262422",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  resetDescription: {
    // Layout
    maxWidth: 300,
    // Typography
    color: "#777570",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    // Layout
    marginTop: 12,
    gap: 16,
  },
  field: {
    // Layout
    gap: 8,
  },
  label: {
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    // Layout
    padding: 12,
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EA",
    backgroundColor: "#F9FAFB",
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    // Typography
    color: ERROR_RED,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  sendLinkButton: {
    // Layout
    height: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE,
    boxShadow: "0 6px 16px rgba(201, 76, 0, 0.25)",
  },
  sendLinkText: {
    // Typography
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  buttonDisabled: {
    // Style
    opacity: 0.5, // faded while fields are invalid or logging in
  },
});
