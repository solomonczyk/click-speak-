import Dexie, { type Table } from "dexie";
import type {
  Deck,
  Card,
  UserSettings,
  StudySession,
  DailyStats,
  AudioBlob,
} from "./schema";

export class ClickSpeakDB extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  settings!: Table<UserSettings, string>;
  studySessions!: Table<StudySession, string>;
  dailyStats!: Table<DailyStats, string>;
  audioBlobs!: Table<AudioBlob, string>;

  constructor() {
    super("ClickSpeakDB");
    this.version(1).stores({
      decks: "id, updatedAt, sourceLang",
      cards: "id, deckId, dueAt, status, [deckId+term]",
      settings: "id",
      studySessions: "id, deckId, startedAt",
      dailyStats: "date",
      audioBlobs: "cardId",
    });
  }
}

export const db = new ClickSpeakDB();
