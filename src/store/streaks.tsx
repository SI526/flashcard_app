import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

// The study streak, backed by the `study_days` table in Supabase.
// A study day is a calendar date (like "2026-11-10") in the account's saved time zone,
// so days run midnight to midnight wherever the user saved it, on any device.

// Which heading the streak card shows.
//   studiedToday: "You’re on a N-day streak!"
//   keepGoing:    studied yesterday but not yet today; the streak is still alive
//   freshStart:   missed a full day (or never studied); the current streak is 0
export type StreakState = "studiedToday" | "keepGoing" | "freshStart";

export type WeekDay = {
  date: string; // "2026-11-10"
  letter: string; // "M"
  label: string; // "Monday, November 10" (for screen readers)
  studied: boolean;
  isToday: boolean;
};

type StreakStore = {
  currentStreak: number;
  longestStreak: number;
  state: StreakState;
  week: WeekDay[]; // this week, Monday to Sunday
  recordStudyDay: () => Promise<void>;
};

// ─── Date helpers (dates are "YYYY-MM-DD" strings) ─────────────────────

// The device's time zone, used until the account has one saved.
const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Today's date in the given time zone, as "YYYY-MM-DD".
function todayIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Moves a date forward (or back, with a negative number) by whole days.
// Works in UTC, so daylight-saving changes can't skip or repeat a day.
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "Monday, November 10"
function longLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// ─── Streak math ────────────────────────────────────────────────────────

// Counts how many days in a row were studied, going back from `start`.
function countBack(days: Set<string>, start: string): number {
  let count = 0;
  let day = start;
  while (days.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

// The longest run of back-to-back study days ever.
function longestRun(days: Set<string>): number {
  let longest = 0;
  for (const day of days) {
    // Only count from the last day of each run (the next day wasn't studied),
    // so each run is counted once.
    if (!days.has(addDays(day, 1))) {
      longest = Math.max(longest, countBack(days, day));
    }
  }
  return longest;
}

const StreakContext = createContext<StreakStore | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const { userId, timeZone: savedTimeZone } = useAuth();
  // The user's study days, and whose they are (so a new login never sees the last user's).
  const [studyDays, setStudyDays] = useState<{ userId: string; days: string[] } | null>(null);
  const timeZone = savedTimeZone ?? DEVICE_TIME_ZONE;

  // Load the logged-in user's study days whenever the user changes.
  useEffect(() => {
    if (userId === null) return;
    supabase
      .from("study_days")
      .select("day")
      .then(({ data, error }) => {
        // If loading fails, the streak just shows as 0 until the next load.
        if (!error) {
          setStudyDays({ userId, days: data.map((row) => row.day as string) });
        }
      });
  }, [userId]);

  const days = new Set(studyDays && studyDays.userId === userId ? studyDays.days : []);
  const today = todayIn(timeZone);
  const yesterday = addDays(today, -1);

  // Current streak: counts back from today if they studied today, else from yesterday
  // (still alive until today ends). Otherwise a full day was missed, so it's 0.
  const state: StreakState = days.has(today)
    ? "studiedToday"
    : days.has(yesterday)
      ? "keepGoing"
      : "freshStart";
  const currentStreak =
    state === "studiedToday"
      ? countBack(days, today)
      : state === "keepGoing"
        ? countBack(days, yesterday)
        : 0;
  // Every study day stays saved, so the record never goes down.
  const longestStreak = longestRun(days);

  // This week, Monday to Sunday. getUTCDay: 0 = Sunday … 6 = Saturday.
  const daysSinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, -daysSinceMonday);
  const week: WeekDay[] = WEEK_LETTERS.map((letter, index) => {
    const date = addDays(monday, index);
    return {
      date,
      letter,
      label: longLabel(date),
      studied: days.has(date),
      isToday: date === today,
    };
  });

  // Called on every card flip. Only the first one each day saves anything.
  async function recordStudyDay() {
    if (userId === null || days.has(today)) return;

    // Show it right away, so the streak updates without waiting for Supabase.
    setStudyDays((previous) => ({
      userId,
      days: [...(previous && previous.userId === userId ? previous.days : []), today],
    }));

    // The first time they study, save the device's time zone to the account,
    // so their days keep the same midnight on every device.
    if (savedTimeZone === null) {
      supabase.auth.updateUser({ data: { time_zone: DEVICE_TIME_ZONE } }).catch(() => {});
    }

    // ignoreDuplicates: if today is already saved (e.g. from another device), do nothing.
    // Studying keeps going even if this fails; the day just won't be saved.
    await supabase
      .from("study_days")
      .upsert({ user_id: userId, day: today }, { onConflict: "user_id,day", ignoreDuplicates: true })
      .then(() => {}, () => {});
  }

  return (
    <StreakContext.Provider
      value={{ currentStreak, longestStreak, state, week, recordStudyDay }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export function useStreaks() {
  const store = useContext(StreakContext);
  if (!store) throw new Error("useStreaks must be used inside StreakProvider");
  return store;
}
