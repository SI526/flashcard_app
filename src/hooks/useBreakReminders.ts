import { useAuth } from "@/store/auth";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// Break reminder timing for one study session (the study screen uses it).
//
// - Counts study time only while reminders are on, the app is open, the user isn't
//   on a break, and `paused` is false (e.g. a settings popup is open).
// - After the saved interval, starts a break: `breakSecondsLeft` counts down from the
//   saved break length. The countdown uses the clock, so it stays right even if the
//   app was in the background.
// - Saving new settings starts a fresh interval. Each study session starts fresh,
//   since the study screen (and this hook) starts over every time.
export function useBreakReminders(paused: boolean) {
  const { breakReminders } = useAuth();
  const intervalSeconds = breakReminders ? breakReminders.intervalMinutes * 60 : null;
  const breakSeconds = breakReminders ? breakReminders.breakMinutes * 60 : null;

  // Seconds studied since the last break (or since reminders were saved).
  // A ref, not state: nothing on screen shows it, so it doesn't need re-renders.
  const studiedSeconds = useRef(0);
  // When the current break ends (a timestamp), or null when not on a break.
  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
  const isOnBreak = breakEndsAt !== null;

  // Track whether the app is open (time in the background doesn't count).
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppIsActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  // New or changed settings start a fresh interval.
  useEffect(() => {
    studiedSeconds.current = 0;
  }, [intervalSeconds, breakSeconds]);

  // Count study time, one second at a time, and start a break when it's time.
  const isCounting =
    intervalSeconds !== null && breakSeconds !== null && appIsActive && !paused && !isOnBreak;
  useEffect(() => {
    if (!isCounting || intervalSeconds === null || breakSeconds === null) return;
    const timer = setInterval(() => {
      studiedSeconds.current += 1;
      if (studiedSeconds.current >= intervalSeconds) {
        studiedSeconds.current = 0;
        setBreakSecondsLeft(breakSeconds);
        setBreakEndsAt(Date.now() + breakSeconds * 1000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCounting, intervalSeconds, breakSeconds]);

  // Tick the break countdown down to 0 (it stays at 0 until they dismiss it).
  useEffect(() => {
    if (breakEndsAt === null) return;
    const timer = setInterval(() => {
      setBreakSecondsLeft(Math.max(0, Math.ceil((breakEndsAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [breakEndsAt]);

  // Dismiss: back to studying on the same card; the next interval starts now.
  function endBreak() {
    studiedSeconds.current = 0;
    setBreakEndsAt(null);
  }

  return { isOnBreak, breakSecondsLeft, endBreak };
}
