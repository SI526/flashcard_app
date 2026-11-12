import { PAGE_BACKGROUND, PAGE_GLOW } from "@/constants/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

// The background for every page, from Figma:
// radial-gradient(223.35% 102.73% at 15% 5%, rgba(255, 225, 203, 0.70) 0%,
// rgba(255, 225, 203, 0.00) 119.4%), #FFFAF6
// SVG stops can't go past 100%, so the sizes below are Figma's multiplied by 1.194.
//
// variant="linear" (Profile & Settings), from Figma:
// linear-gradient(0deg, #FFE1CB 0%, rgba(255, 225, 203, 0.00) 119.4%), #FFFAF6
// Peach at the bottom, fading out upward; it ends 119.4% of the height up,
// so it's still faintly peach at the top.
export default function PageBackground({
  children,
  variant = "glow",
}: {
  children: ReactNode;
  variant?: "glow" | "linear";
}) {
  return (
    <View style={styles.page}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient
              id="pageGlow"
              gradientUnits="userSpaceOnUse"
              cx="0"
              cy="0"
              r="1"
              gradientTransform="translate(15 5) scale(266.68 122.66)"
            >
              <Stop offset="0" stopColor={PAGE_GLOW} stopOpacity={0.7} />
              <Stop offset="1" stopColor={PAGE_GLOW} stopOpacity={0} />
            </RadialGradient>
            {/* From the bottom (y 100) up to 119.4% of the height (y -19.4) */}
            <LinearGradient id="pageFade" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="-19.4">
              <Stop offset="0" stopColor={PAGE_GLOW} stopOpacity={1} />
              <Stop offset="1" stopColor={PAGE_GLOW} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={variant === "linear" ? "url(#pageFade)" : "url(#pageGlow)"}
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
});
