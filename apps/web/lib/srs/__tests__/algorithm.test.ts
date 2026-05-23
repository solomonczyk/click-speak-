import { describe, it, expect } from "vitest";
import { applyGrade, getNextIntervalLabel, initializeCard } from "../algorithm";
import type { Card, Grade } from "../../db/schema";

function makeCard(overrides: Partial<Card> = {}): Card {
  const now = new Date("2026-01-15T12:00:00Z");
  return {
    id: "test-card-1",
    deckId: "deck-1",
    term: "hello",
    translation: "привет",
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
    ...overrides,
  };
}

describe("applyGrade", () => {
  it("again resets progress and reduces easeFactor", () => {
    const card = makeCard({ easeFactor: 2.5, intervalDays: 10, repetitions: 5 });
    const result = applyGrade(card, "again", new Date("2026-01-15T12:00:00Z"));

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(0);
    expect(result.easeFactor).toBe(2.3);
    // after again, repetitions=0, so status reverts to "new"
    expect(result.status).toBe("new");
  });

  it("again never drops easeFactor below MIN_EASE (1.3)", () => {
    const card = makeCard({ easeFactor: 1.3 });
    applyGrade(card, "again", new Date("2026-01-15T12:00:00Z"));
    expect(card.easeFactor).toBe(1.3);
  });

  it("hard: interval = max(2, interval * 1.2)", () => {
    const card = makeCard({ intervalDays: 5, repetitions: 2, easeFactor: 2.5 });
    applyGrade(card, "hard", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(6);
    expect(card.repetitions).toBe(3);
    expect(card.easeFactor).toBe(2.35);
  });

  it("hard for new card (interval=0) gives interval=2 days", () => {
    const card = makeCard({ intervalDays: 0, repetitions: 0 });
    applyGrade(card, "hard", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(2);
    expect(card.repetitions).toBe(1);
  });

  it("good first repetition: interval = 1 day", () => {
    const card = makeCard({ intervalDays: 0, repetitions: 0 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(1);
    expect(card.repetitions).toBe(1);
    expect(card.easeFactor).toBe(2.5); // unchanged
  });

  it("good second repetition: interval = 3 days", () => {
    const card = makeCard({ intervalDays: 1, repetitions: 1 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(3);
    expect(card.repetitions).toBe(2);
  });

  it("good third+ repetition: interval = round(interval * EF)", () => {
    const card = makeCard({ intervalDays: 3, repetitions: 2, easeFactor: 2.5 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(8); // round(3 * 2.5)
    expect(card.repetitions).toBe(3);
  });

  it("easy first repetition: interval = 4 days", () => {
    const card = makeCard({ intervalDays: 0, repetitions: 0 });
    applyGrade(card, "easy", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBe(4);
    expect(card.repetitions).toBe(1);
    expect(card.easeFactor).toBe(2.65);
  });

  it("easy subsequent: interval = round(interval * EF * 1.3), EF bumped first", () => {
    const card = makeCard({ intervalDays: 4, repetitions: 1, easeFactor: 2.5 });
    applyGrade(card, "easy", new Date("2026-01-15T12:00:00Z"));

    // easeFactor is increased BEFORE interval calc: 4 * 2.65 * 1.3 = 13.78 → round = 14
    expect(card.intervalDays).toBe(14);
    expect(card.repetitions).toBe(2);
    expect(card.easeFactor).toBe(2.65);
  });

  it("dueAt is in the future for all grades except again", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const tests: Grade[] = ["hard", "good", "easy"];

    for (const grade of tests) {
      const card = makeCard({ intervalDays: 1, repetitions: 2 });
      applyGrade(card, grade, now);
      expect(new Date(card.dueAt).getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it("dueAt for again is near-future (1 min)", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const card = makeCard({ intervalDays: 5, repetitions: 3 });
    applyGrade(card, "again", now);

    const dueDate = new Date(card.dueAt);
    const diffMs = dueDate.getTime() - now.getTime();
    expect(diffMs).toBeGreaterThanOrEqual(0);
    expect(diffMs / 60000).toBeLessThanOrEqual(2); // ~1 min
  });

  it("status becomes 'mastered' when interval >= 60 and EF >= 2.3", () => {
    const card = makeCard({ intervalDays: 55, repetitions: 6, easeFactor: 2.5 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));

    expect(card.intervalDays).toBeGreaterThanOrEqual(60);
    expect(card.status).toBe("mastered");
  });

  it("status remains 'learning' when interval < 21", () => {
    const card = makeCard({ intervalDays: 0, repetitions: 0 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));
    expect(card.intervalDays).toBe(1);
    expect(card.status).toBe("learning");
  });

  it("status is 'review' for intervals between 21 and 60", () => {
    const card = makeCard({ intervalDays: 20, repetitions: 5, easeFactor: 2.5 });
    applyGrade(card, "good", new Date("2026-01-15T12:00:00Z"));
    expect(card.status).toBe("review");
  });
});

describe("getNextIntervalLabel", () => {
  it('returns "1 мин" for again', () => {
    const card = makeCard();
    expect(getNextIntervalLabel(card, "again")).toBe("1 мин");
  });

  it("returns day count for short intervals", () => {
    // new card → good → interval=1 day → "1 дн"
    const card = makeCard({ intervalDays: 0, repetitions: 0 });
    expect(getNextIntervalLabel(card, "good")).toBe("1 дн");
  });

  it("returns week count for intervals < 30 days", () => {
    // card with interval 5, repetitions 2 → good → interval = round(5 * 2.5) = 13 days
    const card = makeCard({ intervalDays: 5, repetitions: 2, easeFactor: 2.5 });
    const label = getNextIntervalLabel(card, "good");
    expect(label).toBe("1 нед");
  });

  it("returns month count for 30+ day intervals", () => {
    const card = makeCard({ intervalDays: 30, repetitions: 5, easeFactor: 2.5 });
    const label = getNextIntervalLabel(card, "good");
    // good: interval = round(30 * 2.5) = 75 → "2 мес"
    expect(label).toBe("2 мес");
  });
});

describe("initializeCard", () => {
  it("creates a card with default SRS values", () => {
    const card = initializeCard("deck-1", "hello", "привет");

    expect(card.id).toBeDefined();
    expect(card.deckId).toBe("deck-1");
    expect(card.term).toBe("hello");
    expect(card.translation).toBe("привет");
    expect(card.easeFactor).toBe(2.5);
    expect(card.intervalDays).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.status).toBe("new");
    expect(card.dueAt).toBeDefined();
    expect(card.exampleTarget).toBeNull();
    expect(card.phonetic).toBeNull();
    expect(card.createdAt).toBeDefined();
    expect(card.updatedAt).toBeDefined();
  });

  it("generates unique IDs", () => {
    const card1 = initializeCard("d1", "hello", "привет");
    const card2 = initializeCard("d1", "world", "мир");
    expect(card1.id).not.toBe(card2.id);
  });
});
