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
  updateCard: (
    deckId: string,
    cardId: number,
    changes: Partial<Omit<Card, "id">>,
  ) => Promise<void>;
  deleteCard: (deckId: string, cardId: number) => Promise<void>;
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

  function changeCards(deckId: string, change: (cards: Card[]) => Card[]) {
    setDecks((previousDecks) =>
      previousDecks.map((deck) =>
        deck.id === deckId ? { ...deck, cards: change(deck.cards) } : deck,
      ),
    );
  }

  // Decks only live in memory for now, so these can't fail yet. They're async
  // so screens already handle a slow or failed save once decks are stored on a
  // server.
  async function updateCard(deckId: string, cardId: number, changes: Partial<Omit<Card, "id">>) {
    changeCards(deckId, (cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, ...changes } : card)),
    );
  }

  async function deleteCard(deckId: string, cardId: number) {
    changeCards(deckId, (cards) => cards.filter((card) => card.id !== cardId));
  }

  const myDecks = decks.filter((deck) => deck.userId === CURRENT_USER_ID);

  return (
    <DeckContext.Provider value={{ decks: myDecks, addDeck, getDeck, updateCard, deleteCard }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const store = useContext(DeckContext);
  if (!store) throw new Error("useDecks must be used inside DeckProvider");
  return store;
}