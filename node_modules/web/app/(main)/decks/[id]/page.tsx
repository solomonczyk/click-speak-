"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDecksStore } from "@/stores/use-decks-store";
import { cardRepo } from "@/lib/db/repositories";
import type { Card } from "@/lib/db/schema";
import { ArrowLeft, Plus, PlayCircle, Trash2, Upload } from "lucide-react";
import Link from "next/link";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const { decks, loadDecks, deleteDeck } = useDecksStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const deck = decks.find((d) => d.id === deckId);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    async function loadCards() {
      if (deckId) {
        setIsLoading(true);
        try {
          const deckCards = await cardRepo.getByDeckId(deckId);
          setCards(deckCards);
        } catch (error) {
          console.error("Failed to load cards:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadCards();
  }, [deckId]);

  const handleDeleteDeck = () => {
    if (confirm(`Удалить колоду "${deck?.title}"? Все карточки будут потеряны.`)) {
      deleteDeck(deckId);
      router.push("/decks");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm("Удалить эту карточку?")) {
      await cardRepo.delete(cardId);
      const updatedCards = await cardRepo.getByDeckId(deckId);
      setCards(updatedCards);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const rows = lines.slice(1).map((line) => {
        const [term, translation, example] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { term, translation, example };
      });

      const result = await cardRepo.importCSV(deckId, rows);
      alert(`Импортировано: ${result.imported}, пропущено: ${result.skipped.length}`);
      const updatedCards = await cardRepo.getByDeckId(deckId);
      setCards(updatedCards);
    } catch (error) {
      alert("Ошибка при импорте CSV");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="space-y-xl">
        <h1 className="text-headline-lg text-on-surface">Колоды не найдена</h1>
        <Link
          href="/decks"
          className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
        >
          Вернуться к колодам
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <Link
            href="/decks"
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-headline-lg text-on-surface">{deck.title}</h1>
            <p className="text-body-md text-on-surface-variant">
              {deck.sourceLang.toUpperCase()} → {deck.targetLang.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href={`/learn?deckId=${deck.id}`}
            className="flex items-center gap-sm bg-primary text-on-primary px-4 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            <PlayCircle className="w-5 h-5" />
            Учить
          </Link>
          <Link
            href={`/decks/${deck.id}/edit`}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            Редактировать
          </Link>
          <button
            onClick={handleDeleteDeck}
            className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-body-md text-on-surface-variant">
          {cards.length} карточек
        </div>
        <div className="flex items-center gap-sm">
          <label className="flex items-center gap-sm border border-outline px-4 py-2 rounded-lg text-interactive-btn text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Импорт CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <Link
            href={`/decks/${deck.id}/cards/new`}
            className="flex items-center gap-sm bg-primary text-on-primary px-4 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Добавить карточку
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-lg p-xl card-shadow text-center">
          <p className="text-body-lg text-on-surface-variant mb-lg">
            В этой колоде пока нет карточек
          </p>
          <Link
            href={`/decks/${deck.id}/cards/new`}
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Добавить первую карточку
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-lg card-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Слово</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Перевод</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Статус</th>
                <th className="text-left p-4 text-label-caps text-on-surface-variant">Действия</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <td className="p-4">
                    <div className="text-headline-md text-on-surface">{card.term}</div>
                    {card.phonetic && (
                      <div className="text-body-md text-on-surface-variant">
                        [{card.phonetic}]
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-body-md text-on-surface">
                    {card.translation}
                  </td>
                  <td className="p-4">
                    <span className="text-label-caps text-outline">
                      {card.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-sm">
                      <Link
                        href={`/decks/${deck.id}/cards/${card.id}/edit`}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
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
