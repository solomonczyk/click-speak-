"use client";

import { useEffect } from "react";
import { useDecksStore } from "@/stores/use-decks-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { statsRepo } from "@/lib/db/repositories";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { decks, isLoading: decksLoading, loadDecks } = useDecksStore();
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadDecks();
    loadSettings();
  }, [loadDecks, loadSettings]);

  if (decksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
        <h1 className="text-headline-lg text-on-surface mb-sm">
          Готовы к ежедневному обучению?
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-lg">
          Начните повторение карточек или добавьте новые слова
        </p>
        <div className="flex gap-md">
          <Link
            href="/learn"
            className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            Начать обучение
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/decks"
            className="flex items-center gap-sm border border-outline px-6 py-3 rounded-lg text-interactive-btn text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Мои колоды
          </Link>
        </div>
      </section>

      {decks.length === 0 ? (
        <section className="text-center py-xl">
          <div className="text-on-surface-variant text-body-lg mb-md">
            У вас пока нет колод
          </div>
          <Link
            href="/decks/new"
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            Создать первую колоду
          </Link>
        </section>
      ) : (
        <section>
          <h2 className="text-headline-md text-on-surface mb-lg">Активные колоды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {decks.slice(0, 6).map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="bg-surface-container-lowest rounded-lg p-lg card-shadow hover:card-active transition-shadow block"
              >
                <div className="flex items-start justify-between mb-md">
                  <h3 className="text-headline-md text-on-surface">{deck.title}</h3>
                  <span className="text-label-caps text-outline">
                    {deck.sourceLang.toUpperCase()} → {deck.targetLang.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-sm">
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Карточек</span>
                    <span>{deck.cardCount}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Освоено</span>
                    <span>{deck.masteryPercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 mt-sm">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all"
                      style={{ width: `${deck.masteryPercent}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
