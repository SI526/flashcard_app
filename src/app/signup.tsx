import PageBackground from "@/components/PageBackground";
import { ERROR_RED, ORANGE, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
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
  // Supabase's message (e.g. email taken) wins; otherwise show the format check.
  const emailMessage = emailError !== "" ? emailError : emailFormatError;
  const passwordMessage = passwordError !== "" ? passwordError : passwordFormatError;
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
    <PageBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.text}>Let&apos;s get started</Text>
        <Text style={styles.pageTitle}>Create your account</Text>
        <Text style={styles.briefText}>
          Save your decks, study anywhere, and keep your progress in sync.
        </Text>
        <View style={styles.fields}>
          <View style={styles.field}>
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
          </View>
          <View style={styles.field}>
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
            {emailMessage !== "" && <Text style={styles.errorText}>{emailMessage}</Text>}
            {emailTaken && (
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.loginLink}>Log in with this email</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.field}>
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
                {/* Slashed eye while the password is hidden, open eye while it's showing. */}
                {showPassword ? <EyeIcon color={TEXT_GREY} /> : <EyeOffIcon color={TEXT_GREY} />}
              </Pressable>
            </View>
            {passwordMessage !== "" && <Text style={styles.errorText}>{passwordMessage}</Text>}
          </View>
        </View>
        <Text style={styles.policyText}>
          By creating an account, you agree to our{" "}
          <Text style={styles.policyLink}>Terms</Text> and{" "}
          <Text style={styles.policyLink}>Privacy Policy</Text>.
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
          {isSubmitting && <ActivityIndicator color={WHITE} />}
          <Text style={[styles.createAccountText, isSubmitting && styles.createAccountTextLoading]}>
            {isSubmitting ? "Creating your account…" : "Create an Account"}
          </Text>
        </Pressable>
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </View>
        {confirmMessage !== "" && (
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.confirmText}>{confirmMessage}</Text>
            <Text style={styles.loginLink}>Go to log in</Text>
          </Pressable>
        )}
      </ScrollView>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    // Layout
    flexGrow: 1,
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  text: {
    // Layout
    alignSelf: "stretch",
    // Typography
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  pageTitle: {
    // Layout
    marginTop: 12,
    // Typography
    color: "#262422",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  briefText: {
    // Typography
    color: "#6B6B6B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 32,
  },
  fields: {
    // Layout
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 16,
  },
  field: {
    // Layout
    alignSelf: "stretch",
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
    padding: 4,
  },
  errorText: {
    // Typography
    color: ERROR_RED,
    fontSize: 12,
  },
  policyText: {
    // Layout
    marginTop: 12,
    // Typography
    color: "#777570",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 12,
  },
  policyLink: {
    // Typography
    color: ORANGE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    lineHeight: 12,
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
    color: WHITE,
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
    backgroundColor: WHITE,
    marginTop: 36,
  },
  signInRow: {
    // Layout
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 4,
    marginTop: 16,
  },
  signInText: {
    // Typography
    color: "#777570",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  signInLink: {
    // Typography
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  createAccountButtonLoading: {
    // Style
    borderColor: "#652A06",
    backgroundColor: "#652A06", // dark brown from the mockup (estimated)
  },
  createAccountTextLoading: {
    // Typography
    color: WHITE,
  },
  createAccountText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "700",
  },
});
