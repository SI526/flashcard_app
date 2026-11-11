import { ORANGE } from "@/constants/theme";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

type StarButtonProps = {
  starred: boolean;
  onPress: () => void;
  // The term, so screen readers say which card the star belongs to.
  term: string;
  disabled?: boolean;
  // Draws a white rounded box behind the star, for use on top of a card.
  boxed?: boolean;
};

// Five-point star in a 24×24 box.
const STAR_PATH =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z";

// Outline when not starred, filled orange when starred. Drawn with SVG so the
// filled and outline stars look the same on iOS, Android and web.
export default function StarButton({ starred, onPress, term, disabled, boxed }: StarButtonProps) {
  return (
    <Pressable
      role="button"
      aria-pressed={starred}
      accessibilityLabel={starred ? `Unstar ${term}` : `Star ${term}`}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        boxed && styles.boxed,
        pressed && styles.pressed,
      ]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d={STAR_PATH}
          fill={starred ? ORANGE : "none"}
          stroke={ORANGE}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  // Same box as the card's edit button.
  boxed: {
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  pressed: {
    opacity: 0.6,
  },
});
