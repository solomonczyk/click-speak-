import type { Card, Grade, CardStatus } from "../db/schema";

const MIN_EASE = 1.3;
const EASY_BONUS = 1.3;
const HARD_FACTOR = 1.2;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function deriveStatus(card: Card): CardStatus {
  if (card.repetitions === 0) return "new";
  if (card.intervalDays < 21) return "learning";
  if (card.intervalDays >= 60 && card.easeFactor >= 2.3) return "mastered";
  return "review";
}

export function applyGrade(card: Card, grade: Grade, now: Date = new Date()): Card {
  let { easeFactor, intervalDays, repetitions } = card;

  switch (grade) {
    case "again":
      repetitions = 0;
      intervalDays = 0;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      card.dueAt = addMinutes(now, 1).toISOString();
      break;

    case "hard":
      repetitions += 1;
      intervalDays = Math.max(2, intervalDays * HARD_FACTOR);
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      card.dueAt = addDays(now, intervalDays).toISOString();
      break;

    case "good":
      repetitions += 1;
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      card.dueAt = addDays(now, intervalDays).toISOString();
      break;

    case "easy":
      repetitions += 1;
      easeFactor += 0.15;
      if (repetitions === 1) {
        intervalDays = 4;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor * EASY_BONUS);
      }
      card.dueAt = addDays(now, intervalDays).toISOString();
      break;
  }

  card.easeFactor = easeFactor;
  card.intervalDays = intervalDays;
  card.repetitions = repetitions;
  card.status = deriveStatus(card);
  card.updatedAt = now.toISOString();
  return card;
}

export function getNextIntervalLabel(card: Card, grade: Grade): string {
  const tempCard = { ...card };
  applyGrade(tempCard, grade, new Date());
  const dueDate = new Date(tempCard.dueAt);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (grade === "again") return "1 мин";
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "1 дн";
  if (diffDays < 7) return `${diffDays} дн`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед`;
  return `${Math.floor(diffDays / 30)} мес`;
}

export function initializeCard(deckId: string, term: string, translation: string): Card {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    deckId,
    term,
    translation,
    exampleTarget: null,
    exampleNative: null,
    partOfSpeech: null,
    cefrLevel: null,
    phonetic: null,
    notes: null,
    audioUrl: null,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now.toISOString(),
    status: "new",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
