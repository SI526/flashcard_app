import { ORANGE } from "@/constants/theme";
import { EyeIcon } from "@/components/Icons";
import { DUPLICATE_EMAIL_MESSAGE, useAuth } from "@/store/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";


// Validation rules, checked as the user types. Each returns the error text to show,
// or "" if the value is fine (or still empty, so we don't scold before they type).

// Something@something.something, with no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getEmailFormatError(email: string) {
  if (email === "" || EMAIL_PATTERN.test(email)) return "";
  return "Enter a valid email, like name@example.com.";
}

// Password standard: at least 8 characters, with at least one letter and one number.
function getPasswordFormatError(password: string) {
  if (password === "") return "";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return "";
}

export default function Signup({}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  // Recalculated on every keystroke, so errors appear and disappear as the user types.
  const emailFormatError = getEmailFormatError(email);
  const passwordFormatError = getPasswordFormatError(password);
  // The button only works once both fields are filled in and valid (and not already submitting).
  const canSubmit =
    email !== "" &&
    password !== "" &&
    emailFormatError === "" &&
    passwordFormatError === "" &&
    !isSubmitting;

  function handleErrors() {
    let isValid = true;

    setEmailTaken(false);
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

  async function createAccount() {
    if (!handleErrors()) {
      return;
    }
    // Create the account with Supabase. The button is disabled while this runs,
    // so tapping it again can't send a second sign-up.
    setIsSubmitting(true);
    const message = await auth.signUp(name, email, password);
    setIsSubmitting(false); // always re-enable, whether it worked or not

    if (message === DUPLICATE_EMAIL_MESSAGE) {
      // The email already has an account: show it under the email field, with a Log in link.
      setEmailError(message);
      setEmailTaken(true);
      return;
    }
    if (message !== null) {
      setPasswordError(message);
      return;
    }
    // Email confirmation is on, so they aren't logged in yet.
    setConfirmMessage("Check your email to confirm your account, then log in.");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>LET&apos;S GET STARTED</Text>
      <Text style={styles.pageTitle}>Create your account</Text>
      <Text style={styles.briefText}>
        Save your decks, study anywhere, and keep your progress in sync.
      </Text>
      <Text style={styles.label}>Full name</Text>
      <TextInput
        placeholder="Enter your full name"
        placeholderTextColor="#A0A4AB"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        style={styles.input}
      />
      <Text style={styles.label}>Email address</Text>
      <TextInput
        placeholder="you@example.com"
        placeholderTextColor="#A0A4AB"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          // A changed email might not be taken anymore, so clear the old Supabase message.
          setEmailError("");
          setEmailTaken(false);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        style={styles.input}
      />
      {/* Supabase's message (e.g. email taken) wins; otherwise show the format check. */}
      <Text style={styles.errorText}>{emailError !== "" ? emailError : emailFormatError}</Text>
      {emailTaken && (
        <Pressable onPress={() => router.replace("/login")}>
          <Text style={styles.loginLink}>Log in with this email</Text>
        </Pressable>
      )}
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#A0A4AB"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(""); // clear the old Supabase message once they edit
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="off" // "new-password" makes iOS cover the field with a "Strong Password" suggestion
          style={[styles.input, styles.passwordInput]}
        />
        <Pressable
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          {/* TODO: show an eye-with-slash icon when showPassword is true, once we have the SVG. */}
          <EyeIcon color="#9EA2AE" />
        </Pressable>
      </View>
      <Text style={styles.errorText}>
        {passwordError !== "" ? passwordError : passwordFormatError}
      </Text>
      <Pressable
        style={[
          styles.createAccountButton,
          // Faded when the form isn't ready; dark brown (not faded) while creating the account.
          !canSubmit && !isSubmitting && styles.buttonDisabled,
          isSubmitting && styles.createAccountButtonLoading,
        ]}
        onPress={createAccount}
        disabled={!canSubmit}
      >
        {isSubmitting && <ActivityIndicator color="#FFFFFF" />}
        <Text style={[styles.createAccountText, isSubmitting && styles.createAccountTextLoading]}>
          {isSubmitting ? "Creating your account…" : "Create an Account"}
        </Text>
      </Pressable>
      {confirmMessage !== "" && (
        <Pressable onPress={() => router.replace("/login")}>
          <Text style={styles.confirmText}>{confirmMessage}</Text>
          <Text style={styles.loginLink}>Go to log in</Text>
        </Pressable>
      )}
      <Text style={styles.policyText}>
        By creating an account, you agree to our Terms and Privacy Policy.{" "}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  text: {
    // Typography
    color: ORANGE,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  pageTitle: {
    // Typography
    color: "#1F1F1F",
    fontSize: 28,
    marginTop: 12,
  },
  briefText: {
    // Typography
    color: "#6B6B6B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 32,
  },
  label: {
    // Typography
    color: "#444444",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    // Layout
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
    // Style
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    backgroundColor: "#F6F7F9",
    // Typography
    color: "#1F1F1F",
    fontSize: 15,
  },
  passwordRow: {
    // Layout
    justifyContent: "center",
  },
  passwordInput: {
    // Layout
    paddingRight: 48, // room for the eye button
  },
  eyeButton: {
    // Layout
    position: "absolute",
    right: 14,
    top: 8,
    padding: 4,
  },
  errorText: {
    // Typography
    color: "#E21D1D",
    fontSize: 12,
    marginBottom: 8,
  },
  policyText: {
    // Typography
    color: "#9E9E9E",
    fontSize: 11,
    textAlign: "center",
    marginTop: 18,
  },
  confirmText: {
    // Typography
    color: "#1F1F1F",
    fontSize: 14,
    textAlign: "center",
    marginTop: 18,
  },
  loginLink: {
    // Typography
    color: ORANGE,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  appTitle: {
    color: ORANGE,
    fontSize: 44,
    lineHeight: 54,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 180,
  },
  loginButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: ORANGE,
    boxShadow: "0 6px 16px rgba(201, 76, 0, 0.25)",
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    // Style
    opacity: 0.5, // faded while the account is being created
  },
  createAccountButton: {
    flexDirection: "row", // spinner and text side by side
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  createAccountButtonLoading: {
    // Style
    borderColor: "#652A06",
    backgroundColor: "#652A06", // dark brown from the mockup (estimated)
  },
  createAccountTextLoading: {
    // Typography
    color: "#FFFFFF",
  },
  createAccountText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "700",
  },
});
