"use client";

import { useEffect, useState } from "react";
import { useLearnStore } from "@/stores/use-learn-store";
import { useDecksStore } from "@/stores/use-decks-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useSearchParams } from "next/navigation";
import { Volume2, RotateCcw, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { getNextIntervalLabel } from "@/lib/srs/algorithm";
import type { Grade } from "@/lib/db/schema";

export default function LearnPage() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;
  
  const {
    queue,
    currentIndex,
    isFlipped,
    isLoading,
    sessionStats,
    loadQueue,
    flipCard,
    answerCard,
    resetSession,
    endSession,
  } = useLearnStore();
  
  const { decks, loadDecks } = useDecksStore();
  const { settings, loadSettings } = useSettingsStore();
  const [selectedMode, setSelectedMode] = useState<"review" | "new" | "all">("all");

  useEffect(() => {
    loadDecks();
    loadSettings();
  }, [loadDecks, loadSettings]);

  useEffect(() => {
    if (deckId) {
      loadQueue(deckId, selectedMode);
    }
  }, [deckId, selectedMode, loadQueue]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isFlipped) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          flipCard();
        }
      } else {
        if (e.code === "Digit1") answerCard("again");
        if (e.code === "Digit2") answerCard("hard");
        if (e.code === "Digit3") answerCard("good");
        if (e.code === "Digit4") answerCard("easy");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFlipped, flipCard, answerCard]);

  const currentCard = queue[currentIndex];
  const progress = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0;
  const isComplete = currentIndex >= queue.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  if (!deckId) {
    return (
      <div className="space-y-xl">
        <h1 className="text-headline-lg text-on-surface">Обучение</h1>
        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <p className="text-body-md text-on-surface-variant mb-lg">
            Выберите колоду для обучения
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => (window.location.href = `/learn?deckId=${deck.id}`)}
                className="text-left p-lg bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <div className="text-headline-md text-on-surface mb-sm">{deck.title}</div>
                <div className="text-body-md text-on-surface-variant">
                  {deck.cardCount} карточек
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-xl">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => {
              endSession();
              window.location.href = "/";
            }}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline-lg text-on-surface">Сессия завершена</h1>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
          <div className="text-display-vocab text-primary mb-lg">
            {sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy}
          </div>
          <p className="text-body-lg text-on-surface-variant mb-xl">
            карточек изучено
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
            <div className="p-lg bg-surface-container-low rounded-lg">
              <XCircle className="w-8 h-8 text-error mx-auto mb-sm" />
              <div className="text-headline-md text-on-surface">{sessionStats.again}</div>
              <div className="text-label-caps text-on-surface-variant">Снова</div>
            </div>
            <div className="p-lg bg-surface-container-low rounded-lg">
              <AlertCircle className="w-8 h-8 text-outline mx-auto mb-sm" />
              <div className="text-headline-md text-on-surface">{sessionStats.hard}</div>
              <div className="text-label-caps text-on-surface-variant">Сложно</div>
            </div>
            <div className="p-lg bg-surface-container-low rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-secondary mx-auto mb-sm" />
              <div className="text-headline-md text-on-surface">{sessionStats.good}</div>
              <div className="text-label-caps text-on-surface-variant">Хорошо</div>
            </div>
            <div className="p-lg bg-surface-container-low rounded-lg">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-sm" />
              <div className="text-headline-md text-on-surface">{sessionStats.easy}</div>
              <div className="text-label-caps text-on-surface-variant">Легко</div>
            </div>
          </div>

          <button
            onClick={() => {
              endSession();
              loadQueue(deckId, selectedMode);
            }}
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-5 h-5" />
            Начать заново
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="space-y-xl">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => {
              endSession();
              window.location.href = "/";
            }}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline-lg text-on-surface">Нет карточек</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
          <p className="text-body-lg text-on-surface-variant mb-lg">
            Нет карточек для повторения
          </p>
          <button
            onClick={() => {
              endSession();
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const grades: { grade: Grade; label: string; icon: any; color: string }[] = [
    { grade: "again", label: "Снова", icon: XCircle, color: "text-error" },
    { grade: "hard", label: "Сложно", icon: AlertCircle, color: "text-outline" },
    { grade: "good", label: "Хорошо", icon: CheckCircle2, color: "text-secondary" },
    { grade: "easy", label: "Легко", icon: Sparkles, color: "text-primary" },
  ];

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => {
              endSession();
              window.location.href = "/";
            }}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline-lg text-on-surface">Обучение</h1>
        </div>
        <div className="text-body-md text-on-surface-variant">
          {currentIndex + 1} / {queue.length}
        </div>
      </div>

      <div className="w-full bg-surface-container-highest rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow min-h-[400px] flex flex-col justify-center">
        <div className="text-center space-y-lg">
          <div className="text-display-vocab text-on-surface">
            {isFlipped ? currentCard.translation : currentCard.term}
          </div>

          {isFlipped && currentCard.exampleTarget && (
            <div className="text-body-lg text-on-surface-variant italic">
              {currentCard.exampleTarget}
            </div>
          )}

          {isFlipped && currentCard.phonetic && (
            <div className="text-body-md text-on-surface-variant">
              [{currentCard.phonetic}]
            </div>
          )}
        </div>

        <div className="flex justify-center mt-lg">
          <button
            className="p-3 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
            title="Произнести"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {!isFlipped ? (
        <button
          onClick={flipCard}
          className="w-full bg-primary text-on-primary px-6 py-4 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
        >
          Показать ответ (Пробел)
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-md">
          {grades.map(({ grade, label, icon: Icon, color }) => (
            <button
              key={grade}
              onClick={() => answerCard(grade)}
              className="flex flex-col items-center gap-sm p-lg bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <Icon className={`w-8 h-8 ${color}`} />
              <span className="text-label-caps text-on-surface-variant">{label}</span>
              <span className="text-body-md text-on-surface-variant">
                {getNextIntervalLabel(currentCard, grade)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
