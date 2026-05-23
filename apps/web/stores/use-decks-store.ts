import { create } from "zustand";
import type { Deck, DeckWithStats } from "@/lib/db/schema";
import { deckRepo } from "@/lib/db/repositories";

interface DecksState {
  decks: DeckWithStats[];
  isLoading: boolean;
  loadDecks: () => Promise<void>;
  createDeck: (deck: Omit<Deck, "id" | "createdAt" | "updatedAt">) => Promise<Deck>;
  updateDeck: (id: string, updates: Partial<Deck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
}

export const useDecksStore = create<DecksState>((set, get) => ({
  decks: [],
  isLoading: true,

  loadDecks: async () => {
    set({ isLoading: true });
    try {
      const decks = await deckRepo.getWithStats();
      set({ decks, isLoading: false });
    } catch (error) {
      console.error("Failed to load decks:", error);
      set({ isLoading: false });
    }
  },

  createDeck: async (deckData) => {
    try {
      const deck = await deckRepo.create(deckData);
      await get().loadDecks();
      return deck;
    } catch (error) {
      console.error("Failed to create deck:", error);
      throw error;
    }
  },

  updateDeck: async (id, updates) => {
    try {
      await deckRepo.update(id, updates);
      await get().loadDecks();
    } catch (error) {
      console.error("Failed to update deck:", error);
    }
  },

  deleteDeck: async (id) => {
    try {
      await deckRepo.delete(id);
      await get().loadDecks();
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  },
}));
