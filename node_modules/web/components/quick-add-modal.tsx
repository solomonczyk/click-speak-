"use client";

import { useState, useEffect } from "react";
import { useDecksStore } from "@/stores/use-decks-store";
import { cardRepo } from "@/lib/db/repositories";
import { Sparkles, X, Loader2, Wand2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId?: string;
}

interface EnrichedData {
  term: string;
  translation: string;
  exampleTarget: string | null;
  exampleNative: string | null;
  phonetic: string | null;
  partOfSpeech: string | null;
  imageUrl: string | null;
  enrichedBy: string;
}

export function QuickAddModal({ isOpen, onClose, deckId }: QuickAddModalProps) {
  const { decks, loadDecks } = useDecksStore();
  const [term, setTerm] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState(deckId || "");
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [useLLM, setUseLLM] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDecks();
      // Load saved API key from localStorage
      const savedKey = localStorage.getItem("openrouter_api_key");
      if (savedKey) setOpenRouterKey(savedKey);
    }
  }, [isOpen, loadDecks]);

  useEffect(() => {
    if (deckId) setSelectedDeckId(deckId);
  }, [deckId]);

  if (!isOpen) return null;

  const handleEnrich = async () => {
    if (!term.trim()) return;
    
    setIsEnriching(true);
    setError(null);
    setEnrichedData(null);
    setImageLoaded(false);

    try {
      const deck = decks.find(d => d.id === selectedDeckId);
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          sourceLang: deck?.sourceLang || "en",
          targetLang: deck?.targetLang || "ru",
          useLLM: useLLM && !!openRouterKey,
          openRouterKey: openRouterKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка обогащения");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      setEnrichedData(data);
      
      // Save API key to localStorage if provided
      if (openRouterKey && useLLM) {
        localStorage.setItem("openrouter_api_key", openRouterKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!enrichedData || !selectedDeckId) return;

    setIsSaving(true);
    try {
      await cardRepo.create({
        deckId: selectedDeckId,
        term: enrichedData.term,
        translation: enrichedData.translation,
        exampleTarget: enrichedData.exampleTarget,
        exampleNative: enrichedData.exampleNative,
        phonetic: enrichedData.phonetic,
        partOfSpeech: enrichedData.partOfSpeech,
        notes: enrichedData.imageUrl ? `Image: ${enrichedData.imageUrl}` : null,
        cefrLevel: null,
        audioUrl: null,
      });

      // Reset and close
      setTerm("");
      setEnrichedData(null);
      onClose();
    } catch (err) {
      setError("Ошибка сохранения карточки");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl card-shadow max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="text-headline-md text-on-surface">Быстрое добавление</h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Deck selection */}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-2">Колода</label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline"
            >
              <option value="">Выберите колоду</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title} ({deck.sourceLang} → {deck.targetLang})
                </option>
              ))}
            </select>
          </div>

          {/* Term input */}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-2">Слово</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnrich()}
                placeholder="Введите слово..."
                className="flex-1 px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline"
              />
              <button
                onClick={handleEnrich}
                disabled={isEnriching || !term.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-interactive-btn transition-colors",
                  useLLM
                    ? "bg-primary text-on-primary hover:opacity-90"
                    : "bg-secondary text-on-primary hover:opacity-90",
                  (isEnriching || !term.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isEnriching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : useLLM ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                {useLLM ? "AI" : "Обогатить"}
              </button>
            </div>
          </div>

          {/* LLM toggle */}
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
            <input
              type="checkbox"
              id="useLLM"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="useLLM" className="flex-1 text-body-md text-on-surface cursor-pointer">
              Использовать OpenRouter LLM (изображение + лучший перевод)
            </label>
          </div>

          {/* API Key input (when LLM enabled) */}
          {useLLM && (
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">
                OpenRouter API Key
                <span className="text-body-sm text-outline ml-2">(бесплатно на openrouter.ai)</span>
              </label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-error-container text-error rounded-lg text-body-md">
              {error}
            </div>
          )}

          {/* Enriched result preview */}
          {enrichedData && (
            <div className="space-y-4 border-t border-outline-variant pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-headline-lg text-on-surface">{enrichedData.term}</h3>
                  {enrichedData.phonetic && (
                    <p className="text-body-md text-on-surface-variant">[{enrichedData.phonetic}]</p>
                  )}
                </div>
                <span className="text-label-caps text-outline bg-surface-container-low px-2 py-1 rounded">
                  {enrichedData.partOfSpeech}
                </span>
              </div>

              <div>
                <p className="text-body-lg text-on-surface">{enrichedData.translation}</p>
              </div>

              {enrichedData.exampleTarget && (
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <p className="text-body-md text-on-surface italic">{enrichedData.exampleTarget}</p>
                  {enrichedData.exampleNative && (
                    <p className="text-body-md text-on-surface-variant mt-1">{enrichedData.exampleNative}</p>
                  )}
                </div>
              )}

              {/* Generated image */}
              {enrichedData.imageUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-label-caps text-on-surface-variant">
                    <ImageIcon className="w-4 h-4" />
                    Сгенерированное изображение
                  </div>
                  <div className="relative aspect-video bg-surface-container-high rounded-lg overflow-hidden">
                    <img
                      src={enrichedData.imageUrl}
                      alt={`Visualization of ${enrichedData.term}`}
                      className={cn(
                        "w-full h-full object-cover transition-opacity",
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-outline animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enriched by badge */}
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-outline">
                  Обогащено через: {enrichedData.enrichedBy === "llm" ? "OpenRouter LLM + Pollinations AI" : "Словарь + DeepL"}
                </span>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedDeckId}
                className={cn(
                  "w-full flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity",
                  (isSaving || !selectedDeckId) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {isSaving ? "Сохранение..." : "Сохранить карточку"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
