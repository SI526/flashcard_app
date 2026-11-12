import PageBackground from "@/components/PageBackground";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/Icons";
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

export default function Login({}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  // Checked on every keystroke. No error while the field is still empty.
  const emailFormatError =
    email === "" || EMAIL_PATTERN.test(email)
      ? ""
      : "Please enter a valid email address.";
  // The button only works once both fields are filled in, the email is valid, and we're not already logging in.
  const canSubmit =
    email !== "" && password !== "" && emailFormatError === "" && !isSubmitting;

  function handleErrors() {
    let isValid = true;

    if (email === "") {
      setEmailError("Please enter your email address.");
      isValid = false;
    } else {
      setEmailError("");
    }
    if (password === "") {
      setPasswordError("Please enter your password.");
      isValid = false;
    } else {
      setPasswordError("");
    }
    return isValid;
  }

  async function logIn() {
    if (!handleErrors()) {
      return;
    }
    // check the email and password with Supabase. The button is disabled while this runs,
    // so tapping it again can't send a second login.
    setIsSubmitting(true);
    const message = await auth.logIn(email, password);
    setIsSubmitting(false); // always re-enable; the email the user typed stays filled in
    if (message !== null) {
      setPasswordError(message);
    }
  }

  return (
    <PageBackground>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.appTitle}>Log in to keep learning</Text>
        <Text style={styles.subtitle}>
          Your decks and study progress are right where you left them.
        </Text>

        <Text style={styles.label}>Email address</Text>
        <TextInput
          placeholder="you@example.com"
          placeholderTextColor="#A0A4AB"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setPasswordError(""); // clear the old "incorrect" message once they edit
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
        <Text style={styles.errorText}>
          {emailError !== "" ? emailError : emailFormatError}
        </Text>

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#A0A4AB"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(""); // clear the old "incorrect" message once they edit
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {/* Slashed eye while the password is hidden, open eye while it's showing. */}
            {showPassword ? <EyeIcon color={TEXT_GREY} /> : <EyeOffIcon color={TEXT_GREY} />}
          </Pressable>
        </View>
        <View style={styles.passwordFooter}>
          <Text style={styles.errorText}>{passwordError}</Text>
          <Pressable onPress={() => router.push("/resetpassword")}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.loginButton, !canSubmit && styles.buttonDisabled]}
          onPress={logIn}
          disabled={!canSubmit}
        >
          <Text style={styles.loginText}>
            {isSubmitting ? "Logging in…" : "Log in"}
          </Text>
        </Pressable>

        <View style={styles.secureNote}>
          <LockIcon color={TEXT_GREY} />
          <Text style={styles.secureText}>
            Your account is protected with secure sign-in.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to BrainHop? </Text>
          <Pressable onPress={() => router.replace("/signup")}>
            <Text style={styles.footerLink}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 84,
    paddingBottom: 24,
  },
  eyebrow: {
    // Typography
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  appTitle: {
    // Layout
    alignSelf: "stretch",
    marginTop: 12,
    // Typography
    color: "#262422",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    // Layout
    alignSelf: "stretch",
    maxWidth: 312, // wraps at about the end of the title
    marginTop: 12,
    marginBottom: 32,
    // Typography
    color: "#777570",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    // Layout
    marginBottom: 8,
    // Typography
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    // Layout
    padding: 12,
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EA",
    backgroundColor: "#F9FAFB",
    // Typography
    color: "#1F1F1F",
    fontSize: 15,
  },
  passwordRow: {
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
  passwordFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  forgotText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  errorText: {
    flexShrink: 1,
    color: ERROR_RED,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  loginButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: ORANGE,
    boxShadow: "0 6px 16px rgba(201, 76, 0, 0.25)",
    marginTop: 8,
  },
  loginText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    // Style
    opacity: 0.5, // faded while fields are invalid or logging in
  },
  secureNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  secureText: {
    color: "#9E9E9E",
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 20,
  },
  footerText: {
    color: "#6B6B6B",
    fontSize: 13,
  },
  footerLink: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "700",
  },
});
