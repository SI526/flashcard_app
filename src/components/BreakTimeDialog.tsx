import { ORANGE, TEXT_BLACK, WHITE } from "@/constants/theme";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// "05:00" from 300 seconds.
function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type BreakTimeDialogProps = {
  visible: boolean;
  secondsLeft: number;
  onDismiss: () => void;
};

// "Time to take a break!" popup with the break countdown. The card and progress
// underneath don't change; Dismiss goes back to studying.
export default function BreakTimeDialog({ visible, secondsLeft, onDismiss }: BreakTimeDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.dialog} role="alertdialog" aria-modal>
          <View style={styles.textGroup}>
            <Text style={styles.title}>Time to take a break!</Text>
            <Text style={styles.description}>
              You’ve been working hard! Pause studying, stretch, and take a moment to recharge.
            </Text>
          </View>

          {/* The countdown; screen readers hear e.g. "4 minutes 30 seconds" */}
          <View
            style={styles.countdownGroup}
            accessible
            accessibilityLabel={`Break time remaining: ${Math.floor(secondsLeft / 60)} minutes ${secondsLeft % 60} seconds`}
          >
            <Text style={styles.countdown}>{formatCountdown(secondsLeft)}</Text>
            <Text style={styles.countdownLabel}>Break time remaining</Text>
          </View>

          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Matches the Break reminders popup; exact specs still to come.
const styles = StyleSheet.create({
  // Dark see-through layer, same as the other popups
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(20, 17, 15, 0.48)",
  },
  dialog: {
    width: "100%",
    gap: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EA", // Grey-200
    backgroundColor: "#F9FAFB", // Grey-50
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
  countdownGroup: {
    alignItems: "center",
    gap: 4,
  },
  // Big orange "05:00"
  countdown: {
    color: ORANGE,
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    lineHeight: 58,
    fontVariant: ["tabular-nums"], // digits stay the same width, so it doesn't jiggle
  },
  countdownLabel: {
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  dismissText: {
    color: WHITE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
});
