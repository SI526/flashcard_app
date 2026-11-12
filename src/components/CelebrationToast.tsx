import { Image } from "expo-image";
import { useEffect } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type CelebrationToastProps = {
  message: string;
  // When given, the toast can be swiped sideways to close it.
  onDismiss?: () => void;
};

// How far (px) the toast must be dragged sideways to close it.
const DISMISS_DISTANCE = 70;
const CONFETTI_MS = 1350;
const HOP_MS = 700;

// Confetti strips: horizontal position (% of the toast) and color, plus where in
// the fall each one starts so they don't all drop together. From the designers'
// Figma Make prototype.
const CONFETTI = [
  { left: 10, color: "#D93E39", offset: 0 },
  { left: 19, color: "#F2B84B", offset: 0.75 },
  { left: 29, color: "#3DA755", offset: 0.2 },
  { left: 38, color: "#7D5BD6", offset: 1 },
  { left: 47, color: "#E87F8A", offset: 0.45 },
  { left: 57, color: "#C45100", offset: 1.15 },
  { left: 66, color: "#4B8FC8", offset: 0.6 },
  { left: 76, color: "#F2B84B", offset: 0.1 },
  { left: 87, color: "#3DA755", offset: 0.9 },
  { left: 94, color: "#D93E39", offset: 0.35 },
  { left: 4, color: "#7D5BD6", offset: 1.25 },
  { left: 34, color: "#4B8FC8", offset: 0.55 },
  { left: 62, color: "#E87F8A", offset: 0.85 },
  { left: 82, color: "#C45100", offset: 1.3 },
].map((piece) => ({ ...piece, offset: (piece.offset * 1000) / CONFETTI_MS }));

// A white card with the brain mascot hopping and confetti falling behind it.
// With reduced motion on, the mascot stays still and the confetti rests at the
// bottom of the toast.
export default function CelebrationToast({ message, onDismiss }: CelebrationToastProps) {
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(reduceMotion ? 1 : 0);
  const hop = useSharedValue(0);
  const fall = useSharedValue(0);
  const dragX = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  useEffect(() => {
    if (reduceMotion) return;
    shown.set(withTiming(1, { duration: 260, easing: Easing.out(Easing.ease) }));
    hop.set(
      withRepeat(
        withTiming(1, { duration: HOP_MS / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    fall.set(withRepeat(withTiming(1, { duration: CONFETTI_MS, easing: Easing.linear }), -1));
  }, [reduceMotion, shown, hop, fall]);

  const pan = Gesture.Pan()
    .enabled(onDismiss !== undefined)
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      dragX.set(e.translationX);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) < DISMISS_DISTANCE || !onDismiss) {
        dragX.set(withSpring(0));
        return;
      }
      const direction = e.translationX > 0 ? 1 : -1;
      dragX.set(
        withTiming(direction * 500, { duration: 200 }, () => {
          scheduleOnRN(onDismiss);
        }),
      );
    });

  const toastStyle = useAnimatedStyle(() => ({
    opacity: shown.get() * interpolate(Math.abs(dragX.get()), [0, 300], [1, 0], "clamp"),
    transform: [
      { translateX: dragX.get() },
      { translateY: (1 - shown.get()) * -10 },
      { scale: 0.96 + shown.get() * 0.04 },
    ],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hop.get() * -7 },
      { rotate: `${-2 + hop.get() * 4}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        role="status"
        aria-live="polite"
        accessibilityActions={onDismiss ? [{ name: "escape" }, { name: "activate", label: "Dismiss" }] : undefined}
        onAccessibilityAction={onDismiss}
        style={[styles.toast, toastStyle]}
      >
        <View style={styles.confetti} aria-hidden pointerEvents="none">
          {CONFETTI.map((piece, index) => (
            <ConfettiPiece key={index} piece={piece} fall={fall} still={reduceMotion} />
          ))}
        </View>
        <Animated.View style={mascotStyle}>
          <Image
            source={require("@/assets/images/mascot.png")}
            style={styles.mascot}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
        <View style={styles.copy}>
          <Text style={styles.message}>{message}</Text>
          {onDismiss && <Text style={styles.dismissHint}>Swipe to dismiss</Text>}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function ConfettiPiece({
  piece,
  fall,
  still,
}: {
  piece: (typeof CONFETTI)[number];
  fall: SharedValue<number>;
  still: boolean;
}) {
  const style = useAnimatedStyle(() => {
    if (still) {
      return { bottom: 8, opacity: 0.55, transform: [{ rotate: "22deg" }] };
    }
    const p = (fall.get() + piece.offset) % 1;
    const eased = p * p; // speeds up as it falls
    return {
      top: -12,
      opacity: interpolate(p, [0, 0.12, 1], [0, 1, 0]),
      transform: [
        { translateY: -8 + eased * 146 },
        { rotate: `${eased * 270}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.piece, { left: `${piece.left}%`, backgroundColor: piece.color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  toast: {
    width: "100%",
    maxWidth: 420,
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F2C99F",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    boxShadow: "0 12px 34px rgba(105, 47, 8, 0.15)",
  },
  // Clipped to the toast's rounded shape, so the confetti stays inside it.
  confetti: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    borderRadius: 22,
  },
  piece: {
    position: "absolute",
    width: 7,
    height: 13,
    borderRadius: 2,
  },
  mascot: {
    width: 88,
    height: 88,
  },
  copy: {
    flex: 1,
  },
  message: {
    color: "#131927",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  dismissHint: {
    marginTop: 5,
    color: "#8B5540",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
