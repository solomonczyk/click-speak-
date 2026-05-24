"use client";

import { useEffect, useState } from "react";
import { useDecksStore } from "@/stores/use-decks-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { statsRepo } from "@/lib/db/repositories";
import { ArrowRight, Target, Flame, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { decks, isLoading: decksLoading, loadDecks } = useDecksStore();
  const { settings, loadSettings } = useSettingsStore();
  const [streak, setStreak] = useState(0);
  const [todayStats, setTodayStats] = useState({ reviewed: 0, newWords: 0 });

  useEffect(() => {
    loadDecks();
    loadSettings();
    loadDashboardStats();
  }, [loadDecks, loadSettings]);

  const loadDashboardStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [s, todayData] = await Promise.all([
      statsRepo.getStreak(),
      statsRepo.getByDate(today),
    ]);
    setStreak(s);
    setTodayStats({
      reviewed: todayData?.wordsReviewed || 0,
      newWords: todayData?.newWords || 0,
    });
  };

  if (decksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  const dailyGoalReview = settings?.dailyGoalReview || 20;
  const progressPercent = Math.min(100, Math.round((todayStats.reviewed / dailyGoalReview) * 100));

  return (
    <div className="space-y-xl">
      {/* Hero */}
      <section className="bg-surface-container-lowest rounded-xl p-lg card-shadow">
        <h1 className="text-headline-lg text-on-surface mb-sm">Готовы к ежедневному обучению?</h1>
        <p className="text-body-lg text-on-surface-variant mb-lg">
          Начните повторение карточек или добавьте новые слова
        </p>
        <div className="flex gap-md">
          <Link
            href="/learn"
            className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            Начать обучение <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/decks"
            className="flex items-center gap-sm border border-outline px-6 py-3 rounded-lg text-interactive-btn text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Мои колоды
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
        {/* Progress ring */}
        <div className="bg-surface-container-lowest rounded-xl p-lg card-shadow flex flex-col items-center">
          <div className="relative w-20 h-20 mb-sm">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-surface-container-highest)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="32" fill="none" stroke="var(--color-secondary)" strokeWidth="6"
                strokeDasharray={`${progressPercent * 2.01} 201`} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-headline-md text-on-surface">{progressPercent}%</span>
            </div>
          </div>
          <div className="text-label-caps text-outline text-center">Цель на сегодня</div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg card-shadow flex flex-col items-center justify-center">
          <Flame className="w-8 h-8 text-primary mb-sm" />
          <div className="text-headline-lg text-on-surface">{streak}</div>
          <div className="text-label-caps text-outline">Дней подряд</div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg card-shadow flex flex-col items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-secondary mb-sm" />
          <div className="text-headline-lg text-on-surface">{todayStats.reviewed}</div>
          <div className="text-label-caps text-outline">Повторено / {dailyGoalReview}</div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg card-shadow flex flex-col items-center justify-center">
          <BookOpen className="w-8 h-8 text-tertiary mb-sm" />
          <div className="text-headline-lg text-on-surface">{todayStats.newWords}</div>
          <div className="text-label-caps text-outline">Новых слов</div>
        </div>
      </div>

      {/* Decks grid */}
      {decks.length > 0 ? (
        <section>
          <h2 className="text-headline-md text-on-surface mb-lg">Активные колоды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {decks.slice(0, 6).map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="bg-surface-container-lowest rounded-xl p-lg card-shadow hover:card-active transition-shadow block"
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
                  {deck.cardCount > 0 && (
                    <>
                      <div className="flex justify-between text-body-md text-on-surface-variant">
                        <span>Освоено</span>
                        <span>{deck.masteryPercent}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full transition-all" style={{ width: `${deck.masteryPercent}%` }} />
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="text-center py-xl bg-surface-container-lowest rounded-xl card-shadow">
          <Target className="w-12 h-12 text-outline mx-auto mb-md" />
          <div className="text-body-lg text-on-surface-variant mb-md">У вас пока нет колод</div>
          <Link
            href="/decks/new"
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            Создать первую колоду
          </Link>
        </section>
      )}
    </div>
  );
}
