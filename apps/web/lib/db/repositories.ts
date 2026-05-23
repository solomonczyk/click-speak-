import { db } from "./db";
import type {
  Deck,
  Card,
  UserSettings,
  StudySession,
  DailyStats,
  DeckWithStats,
} from "./schema";
import { initializeCard } from "../srs/algorithm";

export const deckRepo = {
  async getAll(): Promise<Deck[]> {
    return await db.decks.toArray();
  },

  async getById(id: string): Promise<Deck | undefined> {
    return await db.decks.get(id);
  },

  async create(deck: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck> {
    const now = new Date().toISOString();
    const newDeck: Deck = {
      ...deck,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.decks.add(newDeck);
    return newDeck;
  },

  async update(id: string, updates: Partial<Deck>): Promise<void> {
    await db.decks.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.cards.where("deckId").equals(id).delete();
      await db.decks.delete(id);
    });
  },

  async getWithStats(): Promise<DeckWithStats[]> {
    const decks = await db.decks.toArray();
    const result: DeckWithStats[] = [];

    for (const deck of decks) {
      const cards = await db.cards.where("deckId").equals(deck.id).toArray();
      const cardCount = cards.length;
      const masteredCount = cards.filter((c) => c.status === "mastered").length;
      const masteryPercent = cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0;
      const lastStudiedAt = cards.length > 0
        ? cards.reduce((latest, c) => (c.updatedAt > latest ? c.updatedAt : latest), cards[0].updatedAt)
        : null;

      result.push({
        ...deck,
        cardCount,
        masteryPercent,
        lastStudiedAt,
      });
    }

    return result;
  },
};

export const cardRepo = {
  async getByDeckId(deckId: string): Promise<Card[]> {
    return await db.cards.where("deckId").equals(deckId).toArray();
  },

  async getDue(deckId?: string): Promise<Card[]> {
    const now = new Date().toISOString();
    if (deckId) {
      return await db.cards
        .where("deckId")
        .equals(deckId)
        .and((card) => card.dueAt <= now)
        .toArray();
    }
    return await db.cards.where("dueAt").belowOrEqual(now).toArray();
  },

  async getById(id: string): Promise<Card | undefined> {
    return await db.cards.get(id);
  },

  async create(card: Omit<Card, "id" | "createdAt" | "updatedAt" | "easeFactor" | "intervalDays" | "repetitions" | "dueAt" | "status">): Promise<Card> {
    const newCard = initializeCard(card.deckId, card.term, card.translation);
    Object.assign(newCard, card);
    await db.cards.add(newCard);
    return newCard;
  },

  async update(id: string, updates: Partial<Card>): Promise<void> {
    await db.cards.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.cards.delete(id);
  },

  async isTermUniqueInDeck(deckId: string, term: string, excludeId?: string): Promise<boolean> {
    const existing = await db.cards
      .where("[deckId+term]")
      .equals([deckId, term])
      .first();
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  },

  async importCSV(deckId: string, rows: Array<{ term: string; translation: string; example?: string }>): Promise<{ imported: number; skipped: string[] }> {
    let imported = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      const isUnique = await this.isTermUniqueInDeck(deckId, row.term);
      if (!isUnique) {
        skipped.push(row.term);
        continue;
      }

      await this.create({
        deckId,
        term: row.term,
        translation: row.translation,
        exampleTarget: row.example || null,
        exampleNative: null,
        partOfSpeech: null,
        cefrLevel: null,
        phonetic: null,
        notes: null,
        audioUrl: null,
      });
      imported++;
    }

    return { imported, skipped };
  },
};

export const settingsRepo = {
  async get(): Promise<UserSettings> {
    let settings = await db.settings.get("default");
    if (!settings) {
      settings = {
        id: "default",
        nativeLanguage: "ru",
        learningLanguage: "en",
        dailyGoalNew: 5,
        dailyGoalReview: 20,
        defaultDeckId: null,
        ttsVoiceId: null,
        shuffleDefault: true,
        updatedAt: new Date().toISOString(),
      };
      await db.settings.add(settings);
    }
    return settings;
  },

  async update(updates: Partial<UserSettings>): Promise<void> {
    await db.settings.update("default", { ...updates, updatedAt: new Date().toISOString() });
  },
};

export const sessionRepo = {
  async create(session: Omit<StudySession, "id" | "startedAt">): Promise<StudySession> {
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    await db.studySessions.add(newSession);
    return newSession;
  },

  async update(id: string, updates: Partial<StudySession>): Promise<void> {
    await db.studySessions.update(id, updates);
  },

  async getRecent(limit = 10): Promise<StudySession[]> {
    return await db.studySessions.orderBy("startedAt").reverse().limit(limit).toArray();
  },
};

export const statsRepo = {
  async getByDate(date: string): Promise<DailyStats | undefined> {
    return await db.dailyStats.get(date);
  },

  async upsert(stats: DailyStats): Promise<void> {
    await db.dailyStats.put(stats);
  },

  async incrementWordsReviewed(date: string, count: number): Promise<void> {
    const existing = await this.getByDate(date);
    if (existing) {
      await this.upsert({ ...existing, wordsReviewed: existing.wordsReviewed + count });
    } else {
      await this.upsert({
        date,
        wordsReviewed: count,
        newWords: 0,
        minutesStudied: 0,
        accuracy: 0,
      });
    }
  },

  async incrementNewWords(date: string): Promise<void> {
    const existing = await this.getByDate(date);
    if (existing) {
      await this.upsert({ ...existing, newWords: existing.newWords + 1 });
    } else {
      await this.upsert({
        date,
        wordsReviewed: 0,
        newWords: 1,
        minutesStudied: 0,
        accuracy: 0,
      });
    }
  },

  async addMinutesStudied(date: string, minutes: number): Promise<void> {
    const existing = await this.getByDate(date);
    if (existing) {
      await this.upsert({ ...existing, minutesStudied: existing.minutesStudied + minutes });
    } else {
      await this.upsert({
        date,
        wordsReviewed: 0,
        newWords: 0,
        minutesStudied: minutes,
        accuracy: 0,
      });
    }
  },

  async updateAccuracy(date: string, accuracy: number): Promise<void> {
    const existing = await this.getByDate(date);
    if (existing) {
      await this.upsert({ ...existing, accuracy });
    } else {
      await this.upsert({
        date,
        wordsReviewed: 0,
        newWords: 0,
        minutesStudied: 0,
        accuracy,
      });
    }
  },

  async getRecent(days: number): Promise<DailyStats[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return await db.dailyStats.where("date").aboveOrEqual(cutoffStr).toArray();
  },

  async getStreak(): Promise<number> {
    const stats = await this.getRecent(365);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const hasActivity = stats.some((s) => s.date === dateStr && (s.wordsReviewed > 0 || s.newWords > 0));

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateStr === today || dateStr === yesterday) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
};
