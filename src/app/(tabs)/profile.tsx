import PageBackground from "@/components/PageBackground";
import { ORANGE, TEXT_BLACK, TEXT_GREY, WHITE } from "@/constants/theme";
import { AccountsCenterIcon, ChevronRightIcon, FlameIcon, StreakCheckIcon } from "@/components/Icons";
import { useAuth } from "@/store/auth";
import { type StreakState, useStreaks } from "@/store/streaks";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

// The streak card's heading and message for each streak state.
function streakHeading(state: StreakState, currentStreak: number) {
  if (state === "freshStart") {
    return {
      title: "Ready for a fresh start?",
      message: "Study a card today to start a new streak.",
    };
  }
  return {
    title: `You’re on a ${currentStreak}-day streak! 🔥`,
    // Studied yesterday but not yet today: the streak is still alive, but needs today.
    message:
      state === "keepGoing"
        ? "Study today to keep your streak going."
        : "Keep studying to extend your run.",
  };
}

export default function Profile() {
  const { logOut } = useAuth();
  const { currentStreak, longestStreak, state, week } = useStreaks();
  const heading = streakHeading(state, currentStreak);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // The button is disabled and shows a spinner while this runs. Once logged out,
  // Stack.Protected sends the user to Welcome; resetting the state brings the button
  // back if something goes wrong.
  async function handleLogOut() {
    setIsLoggingOut(true);
    await logOut();
    setIsLoggingOut(false);
  }

  return (
    <PageBackground>
      <View style={styles.container}>
        {/* Account label, title, and description */}
        <View style={styles.headerGroup}>
          <Text style={styles.account}>Account</Text>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>My profile</Text>
            <Text style={styles.description}>View your account details, study streak, and securely end your session.</Text>
          </View>
        </View>
        {/* Opens the Profile & Settings page */}
        <Pressable style={styles.accountsCenterButton} onPress={() => router.push("/editProfile")}>
          {/* Icon circle with the title and description beside it */}
          <View style={styles.accountsCenterContent}>
            <View style={styles.accountsCenterIconCircle}>
              <AccountsCenterIcon color={WHITE} />
            </View>
            <View style={styles.accountsCenterTextGroup}>
              <Text style={styles.accountsCenterTitle}>Accounts Center</Text>
              <Text style={styles.accountsCenterText}>
                Password, security, preferences, personal details
              </Text>
            </View>
          </View>
          <View style={styles.chevron}>
            <ChevronRightIcon color={TEXT_GREY} />
          </View>
        </Pressable>
        {/* Study streak: heading, current and longest streak, and this week's activity */}
        <View style={styles.signedInContained}>
          {/* Icon circle with the streak message beside it */}
          <View style={styles.streakHeader}>
            <View style={styles.streakIconCircle}>
              <FlameIcon color={WHITE} />
            </View>
            <View style={styles.signedInTextGroup}>
              <Text style={styles.signedInText}>{heading.title}</Text>
              <Text style={styles.syncedText}>{heading.message}</Text>
            </View>
          </View>

          {/* Current streak */}
          <View style={styles.streakStat}>
            <Text style={styles.streakStatLabel}>Current streak</Text>
            <Text style={styles.streakStatValue}>
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </Text>
          </View>

          {/* Longest streak */}
          <View style={styles.streakStat}>
            <Text style={styles.streakStatLabel}>Longest streak</Text>
            <Text style={styles.streakStatValue}>
              {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </Text>
          </View>

          {/* Weekly activity, Monday to Sunday */}
          <View style={styles.weeklyActivity}>
            <Text style={styles.weeklyLabel}>Weekly activity</Text>
            <View style={styles.weekRow}>
              {week.map((day) => (
                <View
                  key={day.date}
                  style={styles.dayColumn}
                  accessible
                  // e.g. "Monday, November 10, studied"
                  accessibilityLabel={`${day.label}, ${day.studied ? "studied" : "not studied"}`}
                >
                  {/* Today's letter is bold and black */}
                  <Text style={[styles.dayLetter, day.isToday && styles.dayLetterToday]}>
                    {day.letter}
                  </Text>
                  <View style={[styles.dayCircle, day.studied && styles.dayCircleStudied]}>
                    {day.studied && <StreakCheckIcon color={WHITE} />}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.logOutGroup}>
          <Pressable
            style={[styles.logOutButton, isLoggingOut && styles.logOutButtonLoading]}
            onPress={handleLogOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut && <ActivityIndicator color={WHITE} />}
            <Text style={[styles.logOutText, isLoggingOut && styles.logOutTextLoading]}>
              {isLoggingOut ? "Logging out…" : "Log out"}
            </Text>
          </Pressable>
          <Text style={styles.logOutNote}>You&apos;ll need to log in again to access your decks.</Text>
        </View>
      </View>
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    // Layout
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  // Wraps the Account label, title, and description
  headerGroup: {
    // Layout
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8, // between Account and My profile
    alignSelf: "stretch",
  },
  // Wraps the title and description
  titleGroup: {
    // Layout
    alignSelf: "stretch",
    gap: 4, // between My profile and the description
  },
  account: {
    // Typography (Text Font/LABEL)
    color: ORANGE,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/H4)
    color: "#262422",
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B4. Body)
    color: "#777570",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  accountsCenterButton: {
    // Layout: profile icon on the left, text on the right
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center", // icon, text, and arrow line up vertically
    alignSelf: "stretch", // width: 345px → full width inside the page padding
    gap: 12,
    marginTop: 24, // gap between the description and this button
  },
  // Wraps the icon circle and the text, to the left of the arrow
  accountsCenterContent: {
    // Layout
    flex: 1, // flex: 1 0 0 → takes the space left of the arrow
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 12, // between the icon circle and the text
  },
  // Orange circle behind the profile icon
  accountsCenterIconCircle: {
    // Layout
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 20, // half the width makes a circle
    backgroundColor: ORANGE,
  },
  // Right arrow at the end of the Accounts Center button
  chevron: {
    // Layout
    flexShrink: 0, // long text wraps instead of squeezing the arrow
  },
  accountsCenterTextGroup: {
    // Layout
    flex: 1,
  },
  accountsCenterTitle: {
    // Typography (placeholder until the spec arrives)
    color: TEXT_BLACK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  accountsCenterText: {
    // Typography (Text Font/B3. Body)
    color: "#6D717F",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // The streak card
  signedInContained: {
    // Layout: heading, streak boxes, and week row stacked
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    gap: 16,
    padding: 16,
    marginTop: 24, // gap between the Accounts Center button and this card
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0095FF",
    backgroundColor: "#E5F4FF",
  },
  // Streak card styles below are basic layout only; exact styles coming later.
  // Icon circle on the left, streak message on the right
  streakHeader: {
    // Layout
    flexDirection: "row",
    alignItems: "center", // flame circle centered next to the two lines of text
    alignSelf: "stretch",
    gap: 12,
  },
  // Blue circle behind the flame icon
  streakIconCircle: {
    // Layout
    width: 40,
    height: 40,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 20,
    backgroundColor: "#0095FF", // Blue-500
  },
  // White box for the current or longest streak
  streakStat: {
    // Layout
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 4,
    padding: 12,
    // Style
    borderRadius: 8,
    backgroundColor: WHITE,
  },
  streakStatLabel: {
    // Typography (Text Font/LABEL)
    color: "#6D717F",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  streakStatValue: {
    // Typography (Text Font/H4)
    color: TEXT_BLACK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
  },
  // Weekly activity label and the day row
  weeklyActivity: {
    alignSelf: "stretch",
    gap: 12,
  },
  weeklyLabel: {
    // Typography (Text Font/LABEL)
    color: TEXT_BLACK,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  weekRow: {
    // Layout: each day takes an equal share of the width
    flexDirection: "row",
  },
  // One day: letter on top, circle below
  dayColumn: {
    // Layout
    flex: 1, // flex: 1 0 0
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  dayLetter: {
    // Typography (Text Font/C2. Caption)
    color: "#6D717F",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  // Today's letter: bold and black, like the mockup (estimated until specs arrive)
  dayLetterToday: {
    color: TEXT_BLACK,
    fontFamily: "Inter_700Bold",
  },
  // Day not studied: empty grey circle
  dayCircle: {
    // Layout
    width: 28,
    height: 28,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // Style
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EA",
    backgroundColor: "#F3F4F6",
  },
  // Day studied: orange circle with a white check
  dayCircleStudied: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  signedInTextGroup: {
    // Layout
    flex: 1,
    gap: 4,
  },
  // "You’re on a N-day streak!"
  signedInText: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/S1. Subtitle)
    color: TEXT_BLACK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    lineHeight: 28,
  },
  // "Keep studying to extend your run."
  syncedText: {
    // Layout
    alignSelf: "stretch",
    // Typography (Text Font/B4. Body)
    color: "#6D717F",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  logOutGroup: {
    // Layout
    marginTop: 24, // gap between the streak card and Log out
    marginBottom: 100,
    gap: 16,
  },
  // Same as the Log out button on Edit Profile
  logOutButton: {
    // Layout
    flexDirection: "row", // spinner and text side by side
    gap: 8,
    height: 48, // the text is centered in this height, so no top/bottom padding
    paddingHorizontal: 20, // (padding 14px top/bottom would leave too little room and cut off the "g")
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    // Style
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    // no fill: only the orange border
    boxShadow: "0 8px 18px 0 rgba(204, 77, 0, 0.16)",
  },
  logOutButtonLoading: {
    // Style
    borderColor: "#652A06",
    backgroundColor: "#652A06", // dark brown from the mockup (estimated)
  },
  logOutTextLoading: {
    // Typography
    color: WHITE,
  },
  logOutText: {
    // Typography (Button Font/Large)
    color: ORANGE, // Text-accent
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  logOutNote: {
    // Typography
    color: "#6B6B6B",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
