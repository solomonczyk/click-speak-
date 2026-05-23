"use client";

import { useState, useEffect, useCallback } from "react";
import { useDecksStore } from "@/stores/use-decks-store";
import { cardRepo } from "@/lib/db/repositories";
import { X, Loader2, Volume2, CheckCircle2, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAddState = "idle" | "loading" | "preview" | "partial_error" | "error";

interface CardDraft {
  term: string;
  translation: string;
  exampleTarget?: string | null;
  exampleNative?: string | null;
  partOfSpeech?: string | null;
  phonetic?: string | null;
  cefrLevel?: string | null;
  audioUrl?: string | null;
  partial?: boolean;
  warnings?: string[];
}

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  defaultDeckId?: string;
}

export function QuickAddModal({ open, onClose, defaultDeckId }: QuickAddModalProps) {
  const { decks, loadDecks } = useDecksStore();
  const [state, setState] = useState<QuickAddState>("idle");
  const [term, setTerm] = useState("");
  const [deckId, setDeckId] = useState(defaultDeckId || "");
  const [draft, setDraft] = useState<CardDraft | null>(null);
  const [editedTranslation, setEditedTranslation] = useState("");
  const [editedExample, setEditedExample] = useState("");
  const [editedPhonetic, setEditedPhonetic] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open) {
      loadDecks();
      setTerm("");
      setState("idle");
      setDraft(null);
      if (defaultDeckId) setDeckId(defaultDeckId);
    }
  }, [open, loadDecks, defaultDeckId]);

  const handleEnrich = useCallback(async () => {
    if (!term.trim() || !deckId) return;

    setState("loading");
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: term.trim(), sourceLang: "en", targetLang: "ru" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Ошибка запроса");
      }

      const data: CardDraft = await res.json();
      setDraft(data);
      setEditedTranslation(data.translation || "");
      setEditedExample(data.exampleTarget || "");
      setEditedPhonetic(data.phonetic || "");

      if (data.partial && data.warnings?.length) {
        setState("partial_error");
      } else {
        setState("preview");
      }
    } catch (e) {
      setState("error");
      setErrorMessage(e instanceof Error ? e.message : "Не удалось загрузить данные");
    }
  }, [term, deckId]);

  const handleSave = async () => {
    if (!draft || !deckId) return;

    try {
      await cardRepo.create({
        deckId,
        term: draft.term,
        translation: editedTranslation || draft.translation,
        exampleTarget: editedExample || draft.exampleTarget || null,
        exampleNative: draft.exampleNative || null,
        partOfSpeech: draft.partOfSpeech || null,
        cefrLevel: draft.cefrLevel || null,
        phonetic: editedPhonetic || draft.phonetic || null,
        notes: null,
        audioUrl: null,
      });
      onClose();
    } catch (e) {
      console.error("Failed to save card:", e);
      setErrorMessage("Ошибка при сохранении");
      setState("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && state === "idle") handleEnrich();
  };

  if (!open) return null;

  const selectedDeck = decks.find((d) => d.id === deckId);
  const sourceLang = selectedDeck?.sourceLang || "en";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-container-lowest rounded-xl p-xl w-full max-w-lg mx-gutter card-shadow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-headline-md text-on-surface">Быстрое добавление</h2>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-md">
          {/* Deck selector */}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-sm">Колода</label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Выберите колоду</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.sourceLang.toUpperCase()} → {d.targetLang.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* States */}
          {state === "idle" && (
            <div className="flex gap-sm">
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Введите слово..."
                className="flex-1 px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleEnrich()}
              />
              <button
                onClick={handleEnrich}
                disabled={!term.trim() || !deckId}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          )}

          {state === "loading" && (
            <div className="bg-surface-container-low rounded-lg p-lg space-y-md">
              <div className="flex items-center gap-sm">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-body-md text-on-surface-variant">Загрузка данных...</span>
              </div>
              <div className="space-y-sm">
                <div className="h-4 bg-surface-container-highest rounded animate-pulse w-1/3" />
                <div className="h-4 bg-surface-container-highest rounded animate-pulse w-2/3" />
                <div className="h-4 bg-surface-container-highest rounded animate-pulse w-1/2" />
              </div>
            </div>
          )}

          {state === "partial_error" && draft && (
            <div className="flex items-center gap-sm p-sm bg-yellow-50 border border-yellow-200 rounded-lg text-body-md text-yellow-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Часть полей не заполнена. Вы можете отредактировать их вручную.</span>
            </div>
          )}

          {(state === "preview" || state === "partial_error") && draft && (
            <div className="bg-surface-container-low rounded-lg p-lg space-y-md">
              <div className="flex items-center justify-between">
                <span className="text-display-vocab text-on-surface">{draft.term}</span>
                <button
                  className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors"
                  title="Произнести"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              <div>
                <label className="block text-label-caps text-on-surface-variant mb-sm">Перевод</label>
                <input
                  type="text"
                  value={editedTranslation}
                  onChange={(e) => setEditedTranslation(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2 bg-surface rounded-lg text-body-md text-on-surface border focus:outline-none focus:ring-2 focus:ring-primary/20",
                    !editedTranslation && state === "partial_error" ? "border-yellow-400" : "border-outline"
                  )}
                />
              </div>

              <div>
                <label className="block text-label-caps text-on-surface-variant mb-sm">Фонетика</label>
                <input
                  type="text"
                  value={editedPhonetic}
                  onChange={(e) => setEditedPhonetic(e.target.value)}
                  placeholder={draft.phonetic || "—"}
                  className="w-full px-4 py-2 bg-surface rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-label-caps text-on-surface-variant mb-sm">Пример</label>
                <textarea
                  value={editedExample}
                  onChange={(e) => setEditedExample(e.target.value)}
                  rows={2}
                  placeholder="Пример предложения"
                  className={cn(
                    "w-full px-4 py-2 bg-surface rounded-lg text-body-md text-on-surface border focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none",
                    !editedExample && state === "partial_error" ? "border-yellow-400" : "border-outline"
                  )}
                />
              </div>

              {draft.partOfSpeech && (
                <div className="text-label-caps text-outline">{draft.partOfSpeech}</div>
              )}
            </div>
          )}

          {state === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-lg text-center">
              <AlertCircle className="w-8 h-8 text-error mx-auto mb-sm" />
              <p className="text-body-md text-error mb-md">{errorMessage}</p>
              <button
                onClick={handleEnrich}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
              >
                Повторить
              </button>
            </div>
          )}

          {/* Actions */}
          {(state === "preview" || state === "partial_error" || state === "error") && (
            <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={state === "error"}
                className="flex items-center gap-sm bg-primary text-on-primary px-4 py-2 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Сохранить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
