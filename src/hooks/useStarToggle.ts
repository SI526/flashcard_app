import { type Card, useDecks } from "@/store/decks";
import { useRef, useState } from "react";

export const STAR_ERROR = "We couldn’t save your change. Please try again.";

// Stars and unstars cards in one deck. Each card ignores new taps until its
// last change has saved, so quick double taps can't get out of order. If a save
// fails the star goes back (the store does that) and `failed` turns on until
// the next star change.
export function useStarToggle(deckId: string) {
  const { setStarred } = useDecks();
  const saving = useRef(new Set<string>());
  const [failed, setFailed] = useState(false);

  async function toggle(card: Card) {
    if (saving.current.has(card.id)) return;
    saving.current.add(card.id);
    setFailed(false);
    try {
      await setStarred(deckId, card.id, !card.starred);
    } catch {
      setFailed(true);
    } finally {
      saving.current.delete(card.id);
    }
  }

  return { toggle, failed };
}
