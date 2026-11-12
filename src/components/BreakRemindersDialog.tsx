import BreakSlider from "@/components/BreakSlider";
import { ERROR_RED, ORANGE, TEXT_BLACK, WHITE } from "@/constants/theme";
import { useAuth } from "@/store/auth";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

// Defaults from the acceptance criteria: a reminder every 25 minutes, a 5-minute break.
const DEFAULT_INTERVAL = 25;
const DEFAULT_BREAK = 5;

// Both sliders run 5 to 60 minutes in 5-minute steps.
const MIN_MINUTES = 5;
const MAX_MINUTES = 60;
const STEP_MINUTES = 5;

// The break reminders popup content (the study screen's settings popup shows it).
//   Reminders off: "Break reminders" with Cancel / Save reminders, starting at the defaults.
//   Reminders on:  "Update your reminders" with Cancel / Update / Delete Reminder,
//                  starting at the saved settings.
// Saving or deleting updates the user's account, then closes. Cancel just closes.
export default function BreakRemindersDialog({ onClose }: { onClose: () => void }) {
  const { breakReminders, saveBreakReminders } = useAuth();
  // Decided once when the popup opens, so the title doesn't flip while it's closing.
  const [isUpdating] = useState(breakReminders !== null);
  const [intervalMinutes, setIntervalMinutes] = useState(
    breakReminders?.intervalMinutes ?? DEFAULT_INTERVAL,
  );
  const [breakMinutes, setBreakMinutes] = useState(
    breakReminders?.breakMinutes ?? DEFAULT_BREAK,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Delete Reminder swaps this popup for the "Delete break reminders?" question.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Saves new settings, or turns reminders off (null). Stays open on failure so they can retry.
  async function save(settings: Parameters<typeof saveBreakReminders>[0]) {
    setIsSaving(true);
    setSaveError("");
    const message = await saveBreakReminders(settings);
    setIsSaving(false);
    if (message !== null) {
      setSaveError(message);
      return;
    }
    onClose();
  }

  if (confirmingDelete) {
    return (
      <View style={styles.dialog}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Delete break reminders?</Text>
          <Text style={styles.description}>
            All active break reminders, the reminder interval, and break duration settings
            will be removed.
          </Text>
        </View>
        {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}
        {/* Stacked: Delete reminders on top, Keep reminders below */}
        <View style={styles.buttonColumn}>
          <Pressable style={styles.deleteButton} onPress={() => save(null)} disabled={isSaving}>
            {isSaving && <ActivityIndicator color={WHITE} />}
            <Text style={styles.saveText}>{isSaving ? "Deleting…" : "Delete reminders"}</Text>
          </Pressable>
          {/* Keep reminders closes everything; nothing changes */}
          <Pressable style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
            <Text style={styles.cancelText}>Keep reminders</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dialog}>
      {/* Title and description */}
      <View style={styles.textGroup}>
        <Text style={styles.title}>{isUpdating ? "Update your reminders" : "Break reminders"}</Text>
        <Text style={styles.description}>
          {isUpdating
            ? "Choose how often you’d like a reminder and how long you’d like to rest."
            : "Choose how often you’d like a reminder and how long you’d like to rest. You can always edit this."}
        </Text>
      </View>

      {/* How often to remind */}
      <View style={styles.setting}>
        <Text style={styles.settingText}>
          Remind me every <Text style={styles.settingValue}>{intervalMinutes}</Text> minutes.
        </Text>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>5 min</Text>
          <Text style={styles.rangeLabel}>1 hour</Text>
        </View>
        <BreakSlider
          value={intervalMinutes}
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          onChange={setIntervalMinutes}
          accessibilityLabel="Remind me every"
          valueText={(minutes) => `${minutes} minutes`}
        />
      </View>

      {/* How long the break is */}
      <View style={styles.setting}>
        <Text style={styles.settingText}>
          Break duration: <Text style={styles.settingValue}>{breakMinutes}</Text>-minute break.
        </Text>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>5 min</Text>
          <Text style={styles.rangeLabel}>1 hour</Text>
        </View>
        <BreakSlider
          value={breakMinutes}
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          onChange={setBreakMinutes}
          accessibilityLabel="Break duration"
          valueText={(minutes) => `${minutes} minutes`}
        />
      </View>

      {saveError !== "" && <Text style={styles.errorText}>{saveError}</Text>}

      {/* Cancel and Save reminders (or Update), side by side */}
      <View style={styles.buttonRow}>
        <Pressable style={[styles.cancelButton, styles.rowButton]} onPress={onClose} disabled={isSaving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, styles.rowButton]}
          onPress={() => save({ intervalMinutes, breakMinutes })}
          disabled={isSaving}
        >
          {isSaving && <ActivityIndicator color={WHITE} />}
          <Text style={styles.saveText}>
            {isSaving ? "Saving…" : isUpdating ? "Update" : "Save reminders"}
          </Text>
        </Pressable>
      </View>

      {/* Only when reminders are on: asks before turning them off */}
      {isUpdating && (
        <Pressable
          style={styles.deleteLink}
          onPress={() => {
            setSaveError("");
            setConfirmingDelete(true);
          }}
          disabled={isSaving}
        >
          <Text style={styles.deleteLinkText}>Delete Reminder</Text>
        </Pressable>
      )}
    </View>
  );
}

// Matches the other popups' text and buttons; exact specs still to come.
const styles = StyleSheet.create({
  dialog: {
    // Layout
    width: "100%",
    gap: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    // Style
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: "#F9FAFB", // Grey-50, like the mockup
    boxShadow: "0 8px 32px 0 rgba(19, 25, 39, 0.19)",
  },
  textGroup: {
    gap: 8,
  },
  title: {
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  description: {
    color: "#6D717F",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // One sentence + range labels + slider
  setting: {
    gap: 8,
  },
  settingText: {
    color: TEXT_BLACK,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // The number inside the sentence, e.g. "25"
  settingValue: {
    color: ORANGE,
    fontFamily: "Inter_700Bold",
  },
  // "5 min" on the left, "1 hour" on the right
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeLabel: {
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: ERROR_RED,
    textAlign: "center",
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  // Delete popup: buttons stacked
  buttonColumn: {
    gap: 16,
  },
  // Side-by-side buttons share the row equally
  rowButton: {
    flex: 1,
  },
  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: WHITE,
  },
  cancelText: {
    color: ORANGE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  saveText: {
    color: WHITE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  // Red "Delete Reminder" text under the buttons
  deleteLink: {
    alignSelf: "center",
    marginTop: -8, // sits a bit closer to the buttons, like the mockup
  },
  deleteLinkText: {
    color: ERROR_RED,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  // Solid red "Delete reminders" in the delete popup
  deleteButton: {
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#D92D20", // red from the mockup (estimated)
  },
});
