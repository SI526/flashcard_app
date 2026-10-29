import { ORANGE } from "@/constants/theme";
import { HomeIcon, PlusIcon, ProfileIcon } from "@/components/Icons";
import { Tabs } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

const GRAY = "#9EA2AE";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: styles.tabBar,
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "Create Deck", tabBarIcon: ({ color }) => <PlusIcon color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}
      />
      {/* Hidden from the tab bar (href: null), but the tab bar still shows on these screens. */}
      <Tabs.Screen name="preview" options={{ title: "Preview Deck", href: null }} />
      <Tabs.Screen name="library" options={{ title: "Your Library", href: null }} />
    </Tabs>
  );
}

// The default tab button, plus the orange bar along the top of the active tab.
function TabButton({ children, style, ...props }: ComponentProps<typeof PlatformPressable>) {
  const isActive = props["aria-selected"];

  return (
    <PlatformPressable {...props} style={style}>
      <View style={[styles.indicator, isActive && styles.indicatorActive]} />
      {children}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FAFAFB",
    borderTopWidth: 0,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  indicatorActive: {
    backgroundColor: ORANGE,
  },
});
