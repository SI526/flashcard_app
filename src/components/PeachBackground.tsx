import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

// Soft peach wash behind the study and completion screens, lightest at the top
// (Sprint 3 mockup). The fallback color shows until the gradient draws.
export default function PeachBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.background}>
      <LinearGradient colors={["#FFF6F0", "#FFE3CF"]} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#FFF6F0",
  },
});
