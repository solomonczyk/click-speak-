import { create } from "zustand";
import type { Card, Grade, StudySession } from "@/lib/db/schema";
import { applyGrade, getNextIntervalLabel } from "@/lib/srs/algorithm";
import { cardRepo, sessionRepo, statsRepo } from "@/lib/db/repositories";

interface LearnState {
  queue: Card[];
  currentIndex: number;
  isFlipped: boolean;
  sessionId: string | null;
  sessionMode: "review" | "new" | "all";
  deckId: string | null;
  isLoading: boolean;
  sessionStats: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  
  loadQueue: (deckId?: string, mode?: "review" | "new" | "all") => Promise<void>;
  flipCard: () => void;
  answerCard: (grade: Grade) => Promise<void>;
  resetSession: () => void;
  endSession: () => Promise<void>;
}

export const useLearnStore = create<LearnState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  sessionId: null,
  sessionMode: "all",
  deckId: null,
  isLoading: true,
  sessionStats: { again: 0, hard: 0, good: 0, easy: 0 },

  loadQueue: async (deckId, mode = "all") => {
    set({ isLoading: true, deckId, sessionMode: mode });
    try {
      const session = await sessionRepo.create({
        deckId: deckId || null,
        mode,
        endedAt: null,
        cardsReviewed: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
      });

      let cards: Card[];
      if (mode === "new") {
        cards = await cardRepo.getByDeckId(deckId || "");
        cards = cards.filter((c) => c.status === "new").slice(0, 20);
      } else if (mode === "review") {
        cards = await cardRepo.getDue(deckId);
      } else {
        const dueCards = await cardRepo.getDue(deckId);
        const newCards = await cardRepo.getByDeckId(deckId || "");
        const filteredNew = newCards.filter((c) => c.status === "new").slice(0, 10);
        cards = [...dueCards, ...filteredNew];
      }

      set({
        queue: cards,
        currentIndex: 0,
        isFlipped: false,
        sessionId: session.id,
        isLoading: false,
        sessionStats: { again: 0, hard: 0, good: 0, easy: 0 },
      });
    } catch (error) {
      console.error("Failed to load queue:", error);
      set({ isLoading: false });
    }
  },

  flipCard: () => {
    set({ isFlipped: true });
  },

  answerCard: async (grade) => {
    const { queue, currentIndex, sessionId, sessionStats } = get();
    if (currentIndex >= queue.length || !sessionId) return;

    const card = queue[currentIndex];
    const updatedCard = applyGrade(card, grade, new Date());
    
    await cardRepo.update(card.id, updatedCard);

    const newStats = { ...sessionStats };
    switch (grade) {
      case "again": newStats.again++; break;
      case "hard": newStats.hard++; break;
      case "good": newStats.good++; break;
      case "easy": newStats.easy++; break;
    }

    await sessionRepo.update(sessionId, {
      cardsReviewed: newStats.again + newStats.hard + newStats.good + newStats.easy,
      againCount: newStats.again,
      hardCount: newStats.hard,
      goodCount: newStats.good,
      easyCount: newStats.easy,
    });

    const today = new Date().toISOString().split("T")[0];
    await statsRepo.incrementWordsReviewed(today, 1);

    set({
      sessionStats: newStats,
      currentIndex: currentIndex + 1,
      isFlipped: false,
    });
  },

  resetSession: () => {
    set({
      queue: [],
      currentIndex: 0,
      isFlipped: false,
      sessionId: null,
      sessionStats: { again: 0, hard: 0, good: 0, easy: 0 },
    });
  },

  endSession: async () => {
    const { sessionId } = get();
    if (sessionId) {
      await sessionRepo.update(sessionId, { endedAt: new Date().toISOString() });
    }
    get().resetSession();
  },
}));
