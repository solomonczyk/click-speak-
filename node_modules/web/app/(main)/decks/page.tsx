"use client";

import { useEffect } from "react";
import { useDecksStore } from "@/stores/use-decks-store";
import { Plus, Search, PlayCircle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DecksPage() {
  const { decks, isLoading, loadDecks, deleteDeck } = useDecksStore();

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-on-surface">Мои колоды</h1>
        <Link
          href="/decks/new"
          className="flex items-center gap-sm bg-primary text-on-primary px-4 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Новая колода
        </Link>
      </div>

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
        <div className="bg-surface-container-lowest rounded-lg card-shadow overflow-hidden">
          <div className="p-4 border-b border-outline-variant">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="text"
                placeholder="Поиск колод..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Название</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Язык</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Карточек</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Освоено</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Действия</th>
              </tr>
            </thead>
            <tbody>
              {decks.map((deck) => (
                <tr
                  key={deck.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <td className="p-4">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="text-headline-md text-on-surface hover:text-primary transition-colors"
                    >
                      {deck.title}
                    </Link>
                    {deck.description && (
                      <p className="text-body-md text-on-surface-variant mt-1">
                        {deck.description}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-label-caps text-outline">
                      {deck.sourceLang.toUpperCase()} → {deck.targetLang.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-body-md text-on-surface">{deck.cardCount}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-sm">
                      <div className="w-24 bg-surface-container-highest rounded-full h-2">
                        <div
                          className="bg-secondary h-2 rounded-full transition-all"
                          style={{ width: `${deck.masteryPercent}%` }}
                        />
                      </div>
                      <span className="text-body-md text-on-surface-variant">
                        {deck.masteryPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-sm">
                      <Link
                        href={`/learn?deckId=${deck.id}`}
                        className="p-2 text-secondary hover:bg-surface-container-low rounded-lg transition-colors"
                        title="Начать обучение"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/decks/${deck.id}/edit`}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить колоду "${deck.title}"? Все карточки будут потеряны.`)) {
                            deleteDeck(deck.id);
                          }
                        }}
                        className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
