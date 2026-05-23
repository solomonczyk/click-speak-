"use client";

import { useEffect, useState } from "react";
import { statsRepo } from "@/lib/db/repositories";
import type { DailyStats } from "@/lib/db/schema";
import { TrendingUp, Clock, Target, Award } from "lucide-react";

export default function StatisticsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [recentStats, currentStreak] = await Promise.all([
          statsRepo.getRecent(7),
          statsRepo.getStreak(),
        ]);
        setStats(recentStats);
        setStreak(currentStreak);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalReviewed = stats.reduce((sum, s) => sum + s.wordsReviewed, 0);
  const totalNew = stats.reduce((sum, s) => sum + s.newWords, 0);
  const totalMinutes = stats.reduce((sum, s) => sum + s.minutesStudied, 0);
  const avgAccuracy = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.accuracy, 0) / stats.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <h1 className="text-headline-lg text-on-surface">Статистика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <div className="flex items-center gap-sm mb-sm">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-label-caps text-on-surface-variant">Серия</span>
          </div>
          <div className="text-headline-lg text-on-surface">{streak} дней</div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <div className="flex items-center gap-sm mb-sm">
            <Target className="w-5 h-5 text-secondary" />
            <span className="text-label-caps text-on-surface-variant">Повторено</span>
          </div>
          <div className="text-headline-lg text-on-surface">{totalReviewed}</div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <div className="flex items-center gap-sm mb-sm">
            <TrendingUp className="w-5 h-5 text-tertiary" />
            <span className="text-label-caps text-on-surface-variant">Новых слов</span>
          </div>
          <div className="text-headline-lg text-on-surface">{totalNew}</div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <div className="flex items-center gap-sm mb-sm">
            <Clock className="w-5 h-5 text-outline" />
            <span className="text-label-caps text-on-surface-variant">Время</span>
          </div>
          <div className="text-headline-lg text-on-surface">{totalMinutes} мин</div>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
        <h2 className="text-headline-md text-on-surface mb-lg">Активность за 7 дней</h2>
        <div className="flex items-end gap-sm h-48">
          {stats.slice(0, 7).map((stat) => {
            const maxWords = Math.max(...stats.map((s) => s.wordsReviewed), 1);
            const height = (stat.wordsReviewed / maxWords) * 100;
            const date = new Date(stat.date);
            const dayName = date.toLocaleDateString("ru", { weekday: "short" });

            return (
              <div key={stat.date} className="flex-1 flex flex-col items-center gap-sm">
                <div className="w-full bg-surface-container-highest rounded-t-lg relative" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-label-caps text-on-surface-variant">{dayName}</span>
                <span className="text-body-md text-on-surface">{stat.wordsReviewed}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
        <h2 className="text-headline-md text-on-surface mb-lg">Точность</h2>
        <div className="flex items-center gap-lg">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="var(--color-surface-container-highest)"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="var(--color-secondary)"
                strokeWidth="8"
                strokeDasharray={`${avgAccuracy * 3.52} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-headline-lg text-on-surface">{avgAccuracy}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-body-md text-on-surface-variant">
              Средняя точность ответов за последние 7 дней
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
