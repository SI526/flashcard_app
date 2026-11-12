import {
  BLUE_100,
  BLUE_600,
  GREEN_200,
  GREEN_800,
  YELLOW_100,
  YELLOW_600,
} from "@/constants/theme";
import type { DeckStatus } from "@/store/decks";
import { StyleSheet, Text, View } from "react-native";

// Label and colors for each study status.
const STATUS_BADGES: Record<DeckStatus, { label: string; background: string; text: string }> = {
  reviewed: { label: "Reviewed", background: GREEN_200, text: GREEN_800 },
  in_progress: { label: "In Progress", background: BLUE_100, text: BLUE_600 },
  not_started: { label: "Not Started", background: YELLOW_100, text: YELLOW_600 },
};

// A deck's study status, used in the library and on Preview.
// The text label means the status doesn't depend on color alone.
export default function StatusBadge({ status }: { status: DeckStatus }) {
  const badge = STATUS_BADGES[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: badge.background }]}>
      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    // Layout
    paddingVertical: 6,
    paddingHorizontal: 12, // wider than Figma's 6 to match the mockup's pill shape
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 20,
  },
  statusText: {
    // Typography (Button Font/Tiny); the color comes from STATUS_BADGES
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    lineHeight: 12,
  },
});
