export type CardStatus = "new" | "learning" | "review" | "mastered";

export type Grade = "again" | "hard" | "good" | "easy";

export type SessionMode = "review" | "new" | "all";

export interface UserSettings {
  id: string;
  nativeLanguage: string;
  learningLanguage: string;
  dailyGoalNew: number;
  dailyGoalReview: number;
  defaultDeckId: string | null;
  ttsVoiceId: string | null;
  shuffleDefault: boolean;
  updatedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  sourceLang: string;
  targetLang: string;
  icon: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  term: string;
  translation: string;
  exampleTarget: string | null;
  exampleNative: string | null;
  partOfSpeech: string | null;
  cefrLevel: string | null;
  phonetic: string | null;
  notes: string | null;
  audioUrl: string | null;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  deckId: string | null;
  mode: SessionMode;
  startedAt: string;
  endedAt: string | null;
  cardsReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
}

export interface DailyStats {
  date: string;
  wordsReviewed: number;
  newWords: number;
  minutesStudied: number;
  accuracy: number;
}

export interface AudioBlob {
  cardId: string;
  data: Blob;
  mimeType: string;
  cachedAt: string;
}

export interface DeckWithStats extends Deck {
  cardCount: number;
  masteryPercent: number;
  lastStudiedAt: string | null;
}
