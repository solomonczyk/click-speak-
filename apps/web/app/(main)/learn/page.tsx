"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useLearnStore } from "@/stores/use-learn-store";
import { useDecksStore } from "@/stores/use-decks-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useSearchParams } from "next/navigation";
import {
  Volume2, RotateCcw, ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Sparkles, Shuffle, LogOut
} from "lucide-react";
import { getNextIntervalLabel } from "@/lib/srs/algorithm";
import type { Grade } from "@/lib/db/schema";

function LearnPageContent() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;

  const {
    queue, currentIndex, isFlipped, isLoading, sessionStats,
    loadQueue, flipCard, answerCard, resetSession, endSession,
  } = useLearnStore();

  const { decks, loadDecks } = useDecksStore();
  const { settings, loadSettings } = useSettingsStore();
  const [selectedMode, setSelectedMode] = useState<"review" | "new" | "all">("all");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => { loadDecks(); loadSettings(); }, [loadDecks, loadSettings]);

  // Build queue when deckId or mode changes
  useEffect(() => {
    if (deckId) {
      loadQueue(deckId, selectedMode);
    }
  }, [deckId, selectedMode, loadQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showExitConfirm) {
        if (e.key === "Escape") setShowExitConfirm(false);
        return;
      }
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
      if (e.key === "Escape") setShowExitConfirm(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, flipCard, answerCard, showExitConfirm]);

  const currentCard = queue[currentIndex];
  const progress = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;
  const isComplete = currentIndex >= queue.length && !isLoading;

  const deck = decks.find((d) => d.id === deckId);

  const handleExit = useCallback(() => {
    endSession();
    window.location.href = "/";
  }, [endSession]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  // No deck selected — pick one
  if (!deckId) {
    return (
      <div className="space-y-xl">
        <h1 className="text-headline-lg text-on-surface">Обучение</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => (window.location.href = `/learn?deckId=${d.id}`)}
              className="text-left p-lg bg-surface-container-lowest rounded-lg card-shadow hover:card-active transition-shadow"
            >
              <div className="text-headline-md text-on-surface mb-sm">{d.title}</div>
              <div className="text-body-md text-on-surface-variant">{d.cardCount} карточек</div>
            </button>
          ))}
        </div>
        {decks.length === 0 && (
          <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
            <p className="text-body-lg text-on-surface-variant mb-lg">Создайте колоду, чтобы начать обучение</p>
            <a href="/decks/new" className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity">
              Создать колоду
            </a>
          </div>
        )}
      </div>
    );
  }

  // Session complete
  if (isComplete && queue.length > 0) {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    return (
      <div className="space-y-xl">
        <div className="flex items-center gap-sm">
          <button onClick={handleExit} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline-lg text-on-surface">Сессия завершена</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
          <div className="text-display-vocab text-primary mb-lg">{total}</div>
          <p className="text-body-lg text-on-surface-variant mb-xl">карточек изучено</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
            {[
              { icon: XCircle, color: "text-error", label: "Снова", value: sessionStats.again },
              { icon: AlertCircle, color: "text-outline", label: "Сложно", value: sessionStats.hard },
              { icon: CheckCircle2, color: "text-secondary", label: "Хорошо", value: sessionStats.good },
              { icon: Sparkles, color: "text-primary", label: "Легко", value: sessionStats.easy },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="p-lg bg-surface-container-low rounded-lg">
                <Icon className={`w-8 h-8 ${color} mx-auto mb-sm`} />
                <div className="text-headline-md text-on-surface">{value}</div>
                <div className="text-label-caps text-on-surface-variant">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-md justify-center">
            <button onClick={() => loadQueue(deckId, selectedMode)} className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity">
              <RotateCcw className="w-5 h-5" />
              Начать заново
            </button>
            <button onClick={handleExit} className="px-6 py-3 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty queue (no due cards)
  if (!currentCard) {
    return (
      <div className="space-y-xl">
        <div className="flex items-center gap-sm">
          <button onClick={handleExit} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-headline-lg text-on-surface">Нет карточек</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-lg" />
          <p className="text-headline-md text-on-surface mb-sm">На сегодня всё готово!</p>
          <p className="text-body-lg text-on-surface-variant mb-lg">
            {deck?.title ? `В колоде "${deck.title}" нет карточек для повторения.` : "Нет карточек для повторения."}
          </p>
          <div className="flex gap-md justify-center">
            <button onClick={() => loadQueue(deckId, "new")} className="bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity">
              Учить новые
            </button>
            <a href="/decks" className="px-6 py-3 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors">
              Другая колода
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Mode selector in session header
  const modes = [
    { value: "all" as const, label: "Всё" },
    { value: "review" as const, label: "Повторение" },
    { value: "new" as const, label: "Новые" },
  ];

  return (
    <>
      <div className="space-y-xl">
        {/* Session header */}
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div className="flex items-center gap-sm">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-headline-lg text-on-surface">{deck?.title || "Обучение"}</div>
              <div className="flex items-center gap-sm text-label-caps text-outline">
                <span>{modes.find((m) => m.value === selectedMode)?.label}</span>
                <span>•</span>
                <span>{currentIndex + 1} / {queue.length}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <div className="flex bg-surface-container-low rounded-lg p-1">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMode(m.value)}
                  className={`px-3 py-1 rounded-md text-label-caps transition-colors ${
                    selectedMode === m.value ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => loadQueue(deckId, selectedMode)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
              title="Перемешать"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container-highest rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Flashcard */}
        <div
          className="perspective-1000 cursor-pointer"
          onClick={() => !isFlipped && flipCard()}
        >
          <div className={`relative w-full min-h-[350px] transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-surface-container-lowest rounded-xl p-xl card-shadow flex flex-col items-center justify-center">
              <div className="text-display-vocab text-on-surface text-center mb-md">{currentCard.term}</div>
              {currentCard.phonetic && (
                <div className="text-body-lg text-on-surface-variant mb-md">[{currentCard.phonetic}]</div>
              )}
              <button
                className="p-3 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
                title="Произнести"
                onClick={(e) => e.stopPropagation()}
              >
                <Volume2 className="w-7 h-7" />
              </button>
              <div className="mt-lg text-label-caps text-outline">Нажмите, чтобы увидеть перевод</div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface-container-lowest rounded-xl p-xl card-shadow flex flex-col items-center justify-center">
              <div className="text-display-vocab text-on-surface text-center mb-lg">{currentCard.translation}</div>
              {currentCard.exampleTarget && (
                <div className="text-body-lg text-on-surface-variant italic text-center max-w-md mb-md">
                  {currentCard.exampleTarget}
                </div>
              )}
              {currentCard.phonetic && (
                <div className="text-body-md text-on-surface-variant mb-md">[{currentCard.phonetic}]</div>
              )}
              {currentCard.partOfSpeech && (
                <div className="text-label-caps text-outline">{currentCard.partOfSpeech}</div>
              )}
            </div>
          </div>
        </div>

        {/* Reveal button (mobile fallback) */}
        {!isFlipped && (
          <button
            onClick={flipCard}
            className="w-full bg-primary text-on-primary px-6 py-4 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity md:hidden"
          >
            Показать ответ
          </button>
        )}

        {/* SRS buttons */}
        {isFlipped && (
          <div className="grid grid-cols-4 gap-md">
            {([["again", "Снова", XCircle, "text-error"],
              ["hard", "Сложно", AlertCircle, "text-outline"],
              ["good", "Хорошо", CheckCircle2, "text-secondary"],
              ["easy", "Легко", Sparkles, "text-primary"],
            ] as [Grade, string, any, string][]).map(([grade, label, Icon, color]) => (
              <button
                key={grade}
                onClick={() => answerCard(grade)}
                className="flex flex-col items-center gap-sm p-lg bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors min-h-[80px]"
              >
                <Icon className={`w-7 h-7 ${color}`} />
                <span className="text-label-caps text-on-surface-variant">{label}</span>
                <span className="text-body-md text-on-surface-variant">
                  {getNextIntervalLabel(currentCard, grade)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exit confirm dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-surface-container-lowest rounded-xl p-xl w-full max-w-sm mx-gutter card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-md text-on-surface mb-md">Выйти из обучения?</h3>
            <p className="text-body-md text-on-surface-variant mb-lg">Прогресс сохранён. Вы можете продолжить позже.</p>
            <div className="flex justify-end gap-md">
              <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors">
                Отмена
              </button>
              <button onClick={handleExit} className="px-4 py-2 rounded-lg text-interactive-btn bg-error text-white hover:opacity-90 transition-opacity">
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for 3D flip */}
      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .preserve-3d { transform-style: flat; }
          .rotate-y-180 { transform: none; }
        }
      `}</style>
    </>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-on-surface-variant">Загрузка...</div></div>}>
      <LearnPageContent />
    </Suspense>
  );
}
