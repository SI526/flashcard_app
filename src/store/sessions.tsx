import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

// Study sessions saved partway through, backed by the `study_sessions` table, so
// "Start studying" resumes where the user left off, on any device, even after logging out.

export type SavedSession = {
  remaining: string[]; // card ids still to study, in order; the first is the current card
  cardIds: string[]; // every card in the deck when this was saved
};

type SessionStore = {
  isLoading: boolean; // true while the user's saved sessions are loading from Supabase
  getSavedSession: (deckId: string) => SavedSession | undefined;
  saveSession: (deckId: string, session: SavedSession) => void;
  clearSession: (deckId: string) => void;
};

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  // Saved sessions by deck id, and whose they are (so a new login never sees the last user's).
  const [saved, setSaved] = useState<{ userId: string; sessions: Record<string, SavedSession> } | null>(
    null,
  );
  const sessions = saved && saved.userId === userId ? saved.sessions : {};
  // Still loading = someone is logged in, but their sessions haven't arrived yet.
  const isLoading = userId !== null && saved?.userId !== userId;

  // Load the logged-in user's saved sessions whenever the user changes, so the
  // study screen can resume right away without waiting.
  useEffect(() => {
    if (userId === null) return;
    supabase
      .from("study_sessions")
      .select("deck_id, remaining, card_ids")
      .then(({ data, error }) => {
        // If loading fails, decks just start from the beginning (and loading still
        // finishes, so the study screen doesn't wait forever).
        const loaded: Record<string, SavedSession> = {};
        for (const row of error ? [] : data) {
          loaded[row.deck_id] = { remaining: row.remaining, cardIds: row.card_ids };
        }
        setSaved({ userId, sessions: loaded });
      });
  }, [userId]);

  function getSavedSession(deckId: string) {
    return sessions[deckId];
  }

  // Saves on screen right away, then to Supabase. Studying keeps going if saving
  // fails; the session just won't be there next time.
  function saveSession(deckId: string, session: SavedSession) {
    if (userId === null) return;
    setSaved((previous) => ({
      userId,
      sessions: {
        ...(previous && previous.userId === userId ? previous.sessions : {}),
        [deckId]: session,
      },
    }));
    supabase
      .from("study_sessions")
      .upsert(
        {
          user_id: userId,
          deck_id: deckId,
          remaining: session.remaining,
          card_ids: session.cardIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,deck_id" },
      )
      .then(
        () => {},
        () => {},
      );
  }

  // Forgets a deck's saved session (finished, or starting over).
  function clearSession(deckId: string) {
    if (userId === null) return;
    setSaved((previous) => {
      const rest = { ...(previous && previous.userId === userId ? previous.sessions : {}) };
      delete rest[deckId];
      return { userId, sessions: rest };
    });
    supabase
      .from("study_sessions")
      .delete()
      .eq("deck_id", deckId)
      .then(
        () => {},
        () => {},
      );
  }

  return (
    <SessionContext.Provider value={{ isLoading, getSavedSession, saveSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  const store = useContext(SessionContext);
  if (!store) throw new Error("useSessions must be used inside SessionProvider");
  return store;
}
