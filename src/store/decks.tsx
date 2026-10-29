import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

// Ids are strings now because the database creates them (UUIDs).
export type Card = { id: string; term: string; answer: string };

export type Deck = {
  id: string;
  userId: string;
  title: string;
  description: string;
  cards: Card[];
};

// What Create sends when saving: just the text. The database makes the ids.
type NewCard = { term: string; answer: string };

type DeckStore = {
  decks: Deck[];
  isLoading: boolean; // true while the user's decks are loading from Supabase
  addDeck: (title: string, description: string, cards: NewCard[]) => Promise<string>;
  getDeck: (id: string) => Deck | undefined;
};

const DeckContext = createContext<DeckStore | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  // Whose decks finished loading last. Still loading = someone is logged in but it's not them yet.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const isLoading = userId !== null && loadedUserId !== userId;

  // Only show decks that belong to whoever is logged in. When logged out (userId is null)
  // this is empty, so nobody sees the last user's decks.
  const myDecks = decks.filter((deck) => deck.userId === userId);

  // Load the logged-in user's decks (with their cards) whenever the user changes.
  useEffect(() => {
    if (userId === null) return;

    supabase
      .from("decks")
      .select("id, user_id, title, description, cards(id, term, answer, position)")
      .order("created_at")
      .order("position", { referencedTable: "cards" })
      .then(({ data, error }) => {
        // If loading fails, the deck list just stays empty.
        if (!error) {
          // Rename the database's snake_case columns to the names the app uses.
          setDecks(
            data.map((row) => ({
              id: row.id,
              userId: row.user_id,
              title: row.title,
              description: row.description,
              cards: row.cards.map((card) => ({
                id: card.id,
                term: card.term,
                answer: card.answer,
              })),
            })),
          );
        }
        setLoadedUserId(userId);
      });
  }, [userId]);

  // Saves a new deck and its cards, then returns the new deck's id.
  // Throws an Error (with Supabase's message) if saving fails.
  async function addDeck(title: string, description: string, cards: NewCard[]) {
    // 1. Save the deck. The database fills in its id and user_id.
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({ title, description })
      .select("id, user_id")
      .single();
    if (deckError) throw new Error(deckError.message);

    // 2. Save the cards, linked to the new deck, in order.
    const { data: savedCards, error: cardsError } = await supabase
      .from("cards")
      .insert(
        cards.map((card, index) => ({
          deck_id: deck.id,
          term: card.term,
          answer: card.answer,
          position: index,
        })),
      )
      .select("id, term, answer");
    if (cardsError) {
      // Don't leave a deck with no cards behind.
      await supabase.from("decks").delete().eq("id", deck.id);
      throw new Error(cardsError.message);
    }

    // 3. Add it to the list on screen too, so Preview can show it right away.
    setDecks((previousDecks) => [
      ...previousDecks,
      { id: deck.id, userId: deck.user_id, title, description, cards: savedCards },
    ]);
    return deck.id;
  }

  function getDeck(id: string) {
    return myDecks.find((deck) => deck.id === id);
  }

  return (
    <DeckContext.Provider value={{ decks: myDecks, isLoading, addDeck, getDeck }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const store = useContext(DeckContext);
  if (!store) throw new Error("useDecks must be used inside DeckProvider");
  return store;
}