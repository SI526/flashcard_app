import { createContext, ReactNode, useContext, useState } from "react";

export type Card = { id: number; term: string; answer: string };

export type Deck = {
  id: string;
  userId: string;
  title: string;
  description: string;
  cards: Card[];
};

// No logins yet, so everyone is this user. Swap for the real user id later.
const CURRENT_USER_ID = "local-user";

type DeckStore = {
  decks: Deck[];
  addDeck: (title: string, description: string, cards: Card[]) => string;
  getDeck: (id: string) => Deck | undefined;
};

const DeckContext = createContext<DeckStore | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);

  function addDeck(title: string, description: string, cards: Card[]) {
    const id = String(Date.now());
    setDecks((previousDecks) => [
      ...previousDecks,
      { id, userId: CURRENT_USER_ID, title, description, cards },
    ]);
    return id;
  }

  function getDeck(id: string) {
    return decks.find((deck) => deck.id === id);
  }

  const myDecks = decks.filter((deck) => deck.userId === CURRENT_USER_ID);

  return (
    <DeckContext.Provider value={{ decks: myDecks, addDeck, getDeck }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const store = useContext(DeckContext);
  if (!store) throw new Error("useDecks must be used inside DeckProvider");
  return store;
}