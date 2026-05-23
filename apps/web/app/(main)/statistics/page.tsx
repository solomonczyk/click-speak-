"use client";

import { useEffect, useState } from "react";
import { statsRepo } from "@/lib/db/repositories";
import type { DailyStats } from "@/lib/db/schema";
import { TrendingUp, Clock, Target, Award } from "lucide-react";
import { useSettingsStore } from "@/stores/use-settings-store";

export default function StatisticsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    loadData();
  }, [loadSettings]);

  const loadData = async () => {
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  const totalReviewed = stats.reduce((sum, s) => sum + s.wordsReviewed, 0);
  const totalNew = stats.reduce((sum, s) => sum + s.newWords, 0);
  const totalMinutes = stats.reduce((sum, s) => sum + s.minutesStudied, 0);
  const avgAccuracy = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.accuracy, 0) / stats.length)
    : 0;

  const maxWords = Math.max(...stats.map((s) => s.wordsReviewed), 1);
  const weeklyGoal = (settings?.dailyGoalReview || 20) * 7;
  const weeklyProgress = Math.min(100, Math.round((totalReviewed / weeklyGoal) * 100));

  return (
    <div className="space-y-xl">
      <h1 className="text-headline-lg text-on-surface">Статистика</h1>

      {/* Weekly goal ring */}
      <div className="bg-surface-container-lowest rounded-xl p-lg card-shadow flex items-center gap-xl">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-surface-container-highest)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="48" fill="none" stroke="var(--color-secondary)" strokeWidth="8"
              strokeDasharray={`${weeklyProgress * 3.01} 301`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-headline-lg text-on-surface">{weeklyProgress}%</span>
            <span className="text-label-caps text-outline">неделя</span>
          </div>
        </div>
        <div>
          <p className="text-headline-md text-on-surface mb-sm">Недельная цель</p>
          <p className="text-body-md text-on-surface-variant">
            {totalReviewed} из {weeklyGoal} слов повторено
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
        {[
          { icon: Award, label: "Серия", value: `${streak} дней`, color: "text-primary" },
          { icon: Target, label: "Повторено", value: totalReviewed.toString(), color: "text-secondary" },
          { icon: TrendingUp, label: "Новых слов", value: totalNew.toString(), color: "text-tertiary" },
          { icon: Clock, label: "Время", value: `${totalMinutes} мин`, color: "text-outline" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface-container-lowest rounded-xl p-lg card-shadow">
            <Icon className={`w-6 h-6 ${color} mb-sm`} />
            <div className="text-headline-md text-on-surface">{value}</div>
            <div className="text-label-caps text-outline">{label}</div>
          </div>
        ))}
      </div>

      {/* Daily activity bar chart */}
      <section className="bg-surface-container-lowest rounded-xl p-lg card-shadow">
        <h2 className="text-headline-md text-on-surface mb-lg">Активность за 7 дней</h2>
        <div className="flex items-end gap-sm" style={{ height: "180px" }}>
          {stats.slice(0, 7).map((stat, i) => {
            const heightPct = (stat.wordsReviewed / maxWords) * 100;
            const date = new Date(stat.date + "T00:00:00");
            const dayName = date.toLocaleDateString("ru", { weekday: "short" });

            return (
              <div key={stat.date || i} className="flex-1 flex flex-col items-center gap-sm h-full justify-end">
                <span className="text-body-md text-on-surface font-medium">{stat.wordsReviewed}</span>
                <div className="w-full rounded-t-lg relative" style={{ height: "100px" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all min-h-[4px]"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-label-caps text-outline">{dayName}</span>
              </div>
            );
          })}
          {stats.length === 0 && (
            <div className="w-full text-center text-body-md text-on-surface-variant py-xl">
              Нет данных за последние 7 дней
            </div>
          )}
        </div>
      </section>

      {/* Accuracy ring */}
      <section className="bg-surface-container-lowest rounded-xl p-lg card-shadow">
        <h2 className="text-headline-md text-on-surface mb-lg">Точность</h2>
        <div className="flex items-center gap-xl">
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-surface-container-highest)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="48" fill="none" stroke="var(--color-secondary)" strokeWidth="8"
                strokeDasharray={`${avgAccuracy * 3.01} 301`} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-headline-lg text-on-surface">{avgAccuracy}%</span>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Средняя точность ответов за последние 7 дней
          </p>
        </div>
      </section>
    </div>
  );
}
