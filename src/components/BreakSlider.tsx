import { ORANGE, WHITE } from "@/constants/theme";
import { useState } from "react";
import { type GestureResponderEvent, StyleSheet, View } from "react-native";

// The slider in the Break reminders popup: snaps to steps (e.g. 5 to 60 minutes in
// steps of 5), with a tick at every step.
// Drag the handle or tap anywhere on the track. Screen readers can swipe up/down to
// change it, and hear the value from `accessibilityLabel` + `valueText`.
type BreakSliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  valueText: (value: number) => string; // e.g. (25) => "25 minutes"
};

const THUMB_SIZE = 22;

export default function BreakSlider({
  value,
  min,
  max,
  step,
  onChange,
  accessibilityLabel,
  valueText,
}: BreakSliderProps) {
  // The track's width, measured once it's on screen.
  const [width, setWidth] = useState(0);
  const stepCount = Math.round((max - min) / step); // 11 gaps for 5…60 by 5
  const fraction = (value - min) / (max - min); // 0 at min, 1 at max

  // Turns a touch position into the nearest step, kept within min…max.
  function valueAt(x: number) {
    if (width === 0) return value;
    const clamped = Math.min(Math.max(x / width, 0), 1);
    return min + Math.round(clamped * stepCount) * step;
  }

  function handleTouch(event: GestureResponderEvent) {
    const next = valueAt(event.nativeEvent.locationX);
    if (next !== value) onChange(next);
  }

  return (
    <View
      style={styles.slider}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      // Take the touch on press and keep it while dragging.
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: valueText(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "increment") onChange(Math.min(value + step, max));
        if (event.nativeEvent.actionName === "decrement") onChange(Math.max(value - step, min));
      }}
    >
      {/* pointerEvents="none" on everything inside, so the touch position (locationX)
          is always measured from the slider's left edge, not from a tick or the handle. */}
      <View style={styles.track} pointerEvents="none" />
      <View style={[styles.fill, { width: fraction * width }]} pointerEvents="none" />
      {Array.from({ length: stepCount + 1 }, (_, index) => (
        <View
          key={index}
          style={[styles.tick, { left: (index / stepCount) * width - 0.5 }]}
          pointerEvents="none"
        />
      ))}
      <View
        style={[styles.thumb, { left: fraction * width - THUMB_SIZE / 2 }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The whole touch area: tall enough to grab easily
  slider: {
    height: 32,
    justifyContent: "center",
  },
  // Light grey line behind everything
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F3F4F6",
  },
  // Orange part, from the start up to the handle
  fill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },
  // Small mark at every step
  tick: {
    position: "absolute",
    width: 1,
    height: 8,
    backgroundColor: "#D2D5DB",
  },
  // Round handle
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: ORANGE,
    backgroundColor: WHITE,
  },
});
