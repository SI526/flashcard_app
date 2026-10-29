import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

// All app icons, drawn from the designers' Figma SVGs so they look the same on
// iOS, Android, and web. Pass `color` from where the icon is used (the tab bar
// passes orange/gray for active/inactive tabs).
type IconProps = { color: ColorValue; size?: number };

const stroke = {
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function HomeIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 8L11.7317 3.13416C11.9006 3.0497 12.0994 3.0497 12.2683 3.13416L22 8"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M20 11V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V11"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

export function PlusIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 12H12M12 12H16M12 12V8M12 12V16" stroke={color} {...stroke} />
      <Path
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

export function ProfileIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M4.27148 18.3457C4.27148 18.3457 6.50051 15.5 12.0005 15.5C17.5005 15.5 19.7295 18.3457 19.7295 18.3457"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9Z"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

export function AddIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 12H12M12 12H18M12 12V6M12 12V18" stroke={color} {...stroke} />
    </Svg>
  );
}

export function CheckIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13L9 17L19 7" stroke={color} {...stroke} />
    </Svg>
  );
}

export function TrashIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.3334 6L12.0034 13.5642C11.8913 14.2017 11.3375 14.6667 10.6903 14.6667H5.30991C4.66261 14.6667 4.10881 14.2017 3.99672 13.5642L2.66675 6"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M14 4.00016H10.25M2 4.00016H5.75M5.75 4.00016V2.66683C5.75 1.93045 6.34695 1.3335 7.08333 1.3335H8.91667C9.65307 1.3335 10.25 1.93045 10.25 2.66683V4.00016M5.75 4.00016H10.25"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

export function LockIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M10.6667 7.99984H11.4C11.7314 7.99984 12 8.26847 12 8.59984V12.7332C12 13.0645 11.7314 13.3332 11.4 13.3332H4.6C4.26863 13.3332 4 13.0645 4 12.7332V8.59984C4 8.26847 4.26863 7.99984 4.6 7.99984H5.33333M10.6667 7.99984V5.33317C10.6667 4.44428 10.1333 2.6665 8 2.6665C5.86667 2.6665 5.33333 4.44428 5.33333 5.33317V7.99984M10.6667 7.99984H5.33333"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

// Taller lock for the Profile "Signed in on this device" box. It's 14 wide x 18 tall,
// so `size` sets the height and the width scales with it.
export function SignedInLockIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={(size * 14) / 18} height={size} viewBox="0 0 14 18" fill="none">
      <Path
        d="M10.75 8.75H12.15C12.4814 8.75 12.75 9.01863 12.75 9.35V16.15C12.75 16.4814 12.4814 16.75 12.15 16.75H1.35C1.01863 16.75 0.75 16.4814 0.75 16.15V9.35C0.75 9.01863 1.01863 8.75 1.35 8.75H2.75M10.75 8.75V4.75C10.75 3.41667 9.95 0.75 6.75 0.75C3.55 0.75 2.75 3.41667 2.75 4.75V8.75M10.75 8.75H2.75"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}

export function EyeIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M21 12C18.7015 9.1582 16.0084 6 12 6C7.99163 6 5.29855 9.15825 3 12C4.88856 14.991 8.2817 18 12 18C15.7183 18 19.1114 14.991 21 12Z"
        stroke={color}
        {...stroke}
      />
    </Svg>
  );
}
