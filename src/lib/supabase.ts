import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

// The one connection to our Supabase project. Import `supabase` from here
// anywhere you need auth or the database. Values come from .env.local.

// Vercel pre-renders web pages in Node.js, where there's no browser storage.
// Only give Supabase storage when there's somewhere to keep the login session.
const isServer = Platform.OS === "web" && typeof window === "undefined";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: isServer ? undefined : AsyncStorage, // remembers who's logged in
      autoRefreshToken: true,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  },
);

// Keep the login fresh only while the app is open (Supabase's recommendation for mobile).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
