import { BackIcon, CameraIcon, ChevronRightIcon, PencilIcon } from "@/components/Icons";
import PageBackground from "@/components/PageBackground";
import { ERROR_RED, ORANGE, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import { useAuth } from "@/store/auth";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Profile & Settings: edit name and email, profile photo, and preferences.
// The name can be edited and saved; the email is shown but can't be changed.
// The photo and the preference rows aren't wired up yet.
export default function EditProfile() {
  const { logOut, name, email, updateName } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Start with the saved name, so the user edits what's already there.
  // (The email can't be changed, so it's only shown.)
  const [nameInput, setNameInput] = useState(name);
  // Whether the user is typing in the name box, so it can show the focused (orange) look.
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Lets the pencil button put the cursor in the name box.
  const nameInputRef = useRef<TextInput>(null);
  const initial = name.charAt(0).toUpperCase();
  const trimmedName = nameInput.trim();
  // The name differs from what's saved.
  const hasChanges = trimmedName !== name;
  // Save changes appears once the user taps into the name box, and stays while
  // there are unsaved edits (so it doesn't vanish when the keyboard closes).
  const showSaveButton = isEditingName || hasChanges || isSaving;
  // Only saves a real, changed name (and not twice at once).
  const canSave = hasChanges && trimmedName !== "" && !isSaving;

  // Saves the new name to the account. On failure the edit stays so they can try again.
  // Returns whether it saved, so the "Save changes?" popup knows if it can leave.
  async function handleSave() {
    if (!canSave) return false;
    setIsSaving(true);
    setSaveError("");
    const message = await updateName(trimmedName);
    setIsSaving(false);
    if (message !== null) {
      setSaveError(message);
      return false;
    }
    setNameInput(trimmedName); // drop any extra spaces they typed
    nameInputRef.current?.blur(); // done editing: close the keyboard
    return true;
  }

  // Back arrow: with unsaved name changes, ask first; otherwise go straight back.
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  function handleBack() {
    if (hasChanges) {
      setConfirmingLeave(true);
      return;
    }
    router.navigate("/profile");
  }

  // "Save changes" in the popup: save, then go back. If saving fails, the popup
  // closes so the error under the name box is visible.
  async function saveAndLeave() {
    const saved = await handleSave();
    setConfirmingLeave(false);
    if (saved) router.navigate("/profile");
  }

  // Same as the Profile page: the button shows a spinner while this runs, and once
  // logged out, Stack.Protected sends the user to Welcome.
  async function handleLogOut() {
    setIsLoggingOut(true);
    await logOut();
    setIsLoggingOut(false);
  }

  return (
    <PageBackground variant="linear">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back to the profile page */}
        <View style={styles.backRow}>
          <Pressable
            accessibilityLabel="Back to profile"
            onPress={handleBack}
            hitSlop={8} // a bit easier to tap than the 30px icon
            style={styles.backButton}
          >
            <BackIcon color={TEXT_BLACK} />
          </Pressable>
        </View>

        {/* Page title and description */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile & Settings</Text>
          <Text style={styles.pageDescription}>
            Update your identity and manage study reminders.
          </Text>
        </View>

        {/* Initial circle, name and email */}
        <View style={styles.profileCredentials}>
          <View style={styles.initialCircle}>
            <Text style={styles.initialText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Everything the user can change */}
        <View style={styles.settingsPanel}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <View style={[styles.inputRow, isEditingName && styles.inputRowFocused]}>
              <TextInput
                value={nameInput}
                onChangeText={(text) => {
                  setNameInput(text);
                  setSaveError(""); // clear an old error once they edit again
                }}
                onFocus={() => setIsEditingName(true)}
                onBlur={() => setIsEditingName(false)}
                editable={!isSaving}
                autoCapitalize="words"
                autoComplete="name"
                style={styles.input}
                ref={nameInputRef}
              />
              {/* Pencil: tapping it starts editing the name */}
              <Pressable accessibilityLabel="Edit name" onPress={() => nameInputRef.current?.focus()}>
                {/* Orange while typing in this box, grey otherwise */}
                <PencilIcon color={isEditingName ? ORANGE : TEXT_GREY} />
              </Pressable>
            </View>
            {trimmedName === "" && <Text style={styles.errorText}>Please enter your name.</Text>}
            {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}
          </View>

          {/* Email: shown only, it can't be changed (so no pencil) */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Text style={[styles.input, styles.readOnlyText]} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {/* Profile photo */}
          <View style={styles.field}>
            <Text style={styles.label}>Profile photo</Text>
            {/* TODO: pick a new photo */}
            <Pressable style={styles.photoRow}>
              <View style={styles.photoCircle}>
                <Text style={styles.initialText}>{initial}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.photoTitle}>Current photo</Text>
                <Text style={styles.photoDescription}>Tap to update your profile image.</Text>
              </View>
              <CameraIcon color={TEXT_GREY} />
            </Pressable>
          </View>

          {/* Preferences */}
          <View style={styles.field}>
            <Text style={styles.label}>Preferences</Text>
            <View style={styles.preferenceList}>
              {/* TODO: open study reminder settings */}
              <Pressable style={styles.preferenceRow}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>Study reminders</Text>
                  <Text style={styles.rowDescription}>Daily at 7:00 PM</Text>
                </View>
                <Text style={styles.reminderStatus}>On</Text>
                <ChevronRightIcon color={TEXT_GREY} />
              </Pressable>

              {/* TODO: open notification preferences */}
              <Pressable style={styles.preferenceRow}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>Notification preferences</Text>
                  <Text style={styles.rowDescription}>Push, email, and weekly summary</Text>
                </View>
                <ChevronRightIcon color={TEXT_GREY} />
              </Pressable>

              {/* TODO: open change password */}
              <Pressable style={styles.preferenceRow}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>Change password</Text>
                  <Text style={styles.rowDescription}>Last updated 3 months ago</Text>
                </View>
                <ChevronRightIcon color={TEXT_GREY} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Log out, below the settings panel */}
        {/* Same as the Log out button on the Profile page */}
        <View style={styles.logOutGroup}>
          {/* Save changes (while editing) above Log out */}
          <View style={styles.buttonGroup}>
            {showSaveButton && (
              <Pressable
                style={[styles.saveButton, !canSave && !isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                {isSaving && <ActivityIndicator color={WHITE} />}
                <Text style={styles.saveText}>{isSaving ? "Saving…" : "Save changes"}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.logOutButton, isLoggingOut && styles.logOutButtonLoading]}
              onPress={handleLogOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut && <ActivityIndicator color={WHITE} />}
              <Text style={[styles.logOutText, isLoggingOut && styles.logOutTextLoading]}>
                {isLoggingOut ? "Logging out…" : "Log out"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.logOutNote}>You&apos;ll need to log in again to access your decks.</Text>
        </View>
      </ScrollView>

      {/* Shown when the back arrow is pressed with an unsaved name */}
      <Modal
        visible={confirmingLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingLeave(false)}
      >
        <View style={styles.leaveOverlay}>
          <View style={styles.leaveBox} role="alertdialog" aria-modal>
            <View style={styles.leaveTextGroup}>
              <Text style={styles.leaveTitle}>Save changes?</Text>
              <Text style={styles.leaveDescription}>
                You have unsaved changes to your name. Would you like to save them?
              </Text>
            </View>
            <View style={styles.leaveButtons}>
              <Pressable
                style={styles.leaveSaveButton}
                onPress={saveAndLeave}
                disabled={isSaving}
              >
                {isSaving && <ActivityIndicator color={WHITE} />}
                <Text style={styles.leaveSaveText}>{isSaving ? "Saving…" : "Save changes"}</Text>
              </Pressable>
              <Pressable
                style={styles.keepEditingButton}
                onPress={() => setConfirmingLeave(false)}
                disabled={isSaving}
              >
                <Text style={styles.keepEditingText}>Keep editing</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PageBackground>
  );
}

// Basic layout only; the Figma styling comes later.
const styles = StyleSheet.create({
  container: {
    // Layout (width 393 / height 1366 come from the screen and the content)
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 24, // between every section on the page
    paddingTop: 60, // padding: 60px 24px 84px 24px
    paddingHorizontal: 24,
    paddingBottom: 84,
  },
  // Row holding the back arrow
  backRow: {
    // Layout
    alignSelf: "stretch", // width: 345px → full width inside the page padding
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // 30×30 circle around the back arrow
  backButton: {
    // Layout
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 100, // fully round
    backgroundColor: "rgba(255, 255, 255, 0.90)", // white-90
  },
  header: {
    alignSelf: "stretch", // full width, since the page centers its children
  },
  // "Profile & Settings"
  pageTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/S2. Subtitle)
    color: TEXT_BLACK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  // "Update your identity and manage study reminders."
  pageDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // Initial circle, name and email (moved from the Profile page)
  profileCredentials: {
    // Layout
    alignItems: "center",
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
    // Typography (Text Font/H1)
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 48,
    lineHeight: 58,
  },
  name: {
    // Typography (Text Font/H5)
    marginTop: 20,
    color: TEXT_BLACK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
  },
  email: {
    // Typography (Text Font/B4. Body)
    marginTop: 8,
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  // Wraps Name, Email, Profile photo, and Preferences
  settingsPanel: {
    // Layout
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch", // full width, since the page centers its children
    gap: 16,
    padding: 16,
    // Style
    borderRadius: 12,
    backgroundColor: "#F9FAFB", // Grey-50
  },
  field: {
    // Layout
    alignSelf: "stretch", // full width, since the panel lines its children up on the left
    gap: 8,
  },
  // "Name", "Email", "Profile photo", "Preferences"
  label: {
    // Layout
    alignSelf: "stretch", // flex: 1 0 0 → full width (flex: 1 here would stretch it taller)
    // Typography (Text Font/B2. Body)
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  // The input box: the border sits on this row so the pencil is inside the box.
  inputRow: {
    // Layout
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12, // between the text and the pencil
    padding: 12,
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: "#F9FAFB", // Grey-50
  },
  // While typing: orange border and light orange fill
  inputRowFocused: {
    borderColor: ORANGE, // Primary-500
    backgroundColor: "#FFF5EB", // Primary-50
  },
  // The typed name or email
  input: {
    // Layout
    flex: 1, // flex: 1 0 0 → takes the space left of the pencil
    height: 24, // the spec's 24px line height; lineHeight on a TextInput pushes the text down on iOS
    padding: 0, // the row's 12px padding is the only space around the text
    // Typography (Text Font/B1. Body)
    color: TEXT_BLACK,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  // Save changes and Log out, stacked
  buttonGroup: {
    // Layout
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    gap: 12,
  },
  saveButton: {
    // Layout
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48, // the text is centered in this height, so no top/bottom padding
    paddingHorizontal: 20, // (padding 14px top/bottom would cut off the text, like Log out)
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE, // Primary-500
  },
  // Faded until there's a changed, non-empty name to save
  saveButtonDisabled: {
    opacity: 0.5,
  },
  // The email box text: the same as the name, but it can't be edited
  readOnlyText: {
    lineHeight: 24, // a Text (unlike a TextInput) centers fine with a line height
  },
  errorText: {
    // Typography
    color: ERROR_RED,
    fontSize: 12,
  },
  saveText: {
    // Typography (placeholder: same as Log out, in white)
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  // Profile photo box: circle, text, camera
  photoRow: {
    // Layout
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12,
    paddingVertical: 12, // padding: 12px 14px
    paddingHorizontal: 14,
    // Style
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: WHITE,
  },
  photoCircle: {
    // Layout
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 40, // half the width makes a circle
    backgroundColor: ORANGE, // Primary-500
  },
  // "Current photo"
  photoTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B4. Body)
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  // "Tap to update your profile image."
  photoDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  rowInfo: {
    flex: 1,
  },
  // Preference row title, e.g. "Study reminders"
  rowTitle: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B4. Body)
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  // Preference row description, e.g. "Daily at 7:00 PM"
  rowDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceList: {
    gap: 12,
  },
  // One preference: text on the left, (On) and arrow on the right
  preferenceRow: {
    // Layout
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12, // keeps the text from touching "On" or the arrow
    paddingVertical: 12, // padding: 12px 14px
    paddingHorizontal: 14,
    // Style
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: WHITE,
  },
  // "On" next to Study reminders
  reminderStatus: {
    // Typography (Text Font/B4. Body)
    color: ORANGE, // Text-accent
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  // Dark see-through layer behind the "Save changes?" popup (same as Edit Deck's)
  leaveOverlay: {
    // Layout
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    // Style
    backgroundColor: "rgba(20, 17, 15, 0.48)",
  },
  // The "Save changes?" popup
  leaveBox: {
    // Layout
    width: "100%", // same width as the page's content: the overlay has the page's 24px side padding
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 20,
    paddingVertical: 28, // padding: 28px 24px
    paddingHorizontal: 24,
    // Style
    borderRadius: 16,
    backgroundColor: WHITE,
    boxShadow: "0 8px 32px 0 rgba(19, 25, 39, 0.19)",
  },
  // Title and description
  leaveTextGroup: {
    // Layout
    alignSelf: "stretch",
    gap: 8,
  },
  // "Save changes?"
  leaveTitle: {
    // Layout
    alignSelf: "stretch", // full width so text-align: center centers it in the popup
    // Typography (Text Font/S2. Subtitle)
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  // "You have unsaved changes to your name…"
  leaveDescription: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // Save changes and Keep editing, stacked
  leaveButtons: {
    // Layout
    alignSelf: "stretch",
    gap: 12,
  },
  leaveSaveButton: {
    // Layout
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    paddingVertical: 14, // padding: 14px 20px
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    backgroundColor: ORANGE, // Primary-500
  },
  leaveSaveText: {
    // Typography (same as the page's Save changes)
    color: WHITE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  keepEditingButton: {
    // Layout
    paddingVertical: 14, // padding: 14px 20px
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE, // Primary-500
    backgroundColor: WHITE,
  },
  keepEditingText: {
    // Typography (same as Log out)
    color: ORANGE,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  // Log out button and the note under it (same as the Profile page)
  logOutGroup: {
    // Layout
    alignSelf: "stretch",
    gap: 16,
  },
  logOutButton: {
    // Layout
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48, // the text is centered in this height, so no top/bottom padding
    paddingHorizontal: 20, // (padding 14px top/bottom would leave too little room and cut off the "g")
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    // no fill: only the orange border
    boxShadow: "0 8px 18px 0 rgba(204, 77, 0, 0.16)",
  },
  logOutButtonLoading: {
    // Style
    borderColor: "#652A06",
    backgroundColor: "#652A06", // dark brown from the mockup (estimated)
  },
  logOutText: {
    // Typography (Button Font/Large)
    color: ORANGE, // Text-accent
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  logOutTextLoading: {
    // Typography
    color: WHITE,
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
