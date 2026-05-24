"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cardRepo } from "@/lib/db/repositories";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewCardPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [exampleTarget, setExampleTarget] = useState("");
  const [exampleNative, setExampleNative] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !translation.trim()) return;

    setIsSubmitting(true);
    try {
      await cardRepo.create({
        deckId,
        term: term.trim(),
        translation: translation.trim(),
        exampleTarget: exampleTarget.trim() || null,
        exampleNative: exampleNative.trim() || null,
        phonetic: phonetic.trim() || null,
        notes: notes.trim() || null,
        partOfSpeech: null,
        cefrLevel: null,
        audioUrl: null,
      });
      router.push(`/decks/${deckId}`);
    } catch (error) {
      console.error("Failed to create card:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-xl">
      <div className="flex items-center gap-sm">
        <Link
          href={`/decks/${deckId}`}
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-headline-lg text-on-surface">Новая карточка</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl max-w-2xl">
        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Слово *
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Слово на изучаемом языке"
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Перевод *
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Перевод на родной язык"
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-label-caps text-on-surface-variant mb-sm">
            Транскрипция
            </label>
            <input
              type="text"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="Например: /həˈləʊ/"
              className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Пример (изучаемый язык)
              </label>
              <textarea
                value={exampleTarget}
                onChange={(e) => setExampleTarget(e.target.value)}
                placeholder="Пример предложения на изучаемом языке"
                rows={2}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Пример (родной язык)
              </label>
              <textarea
                value={exampleNative}
                onChange={(e) => setExampleNative(e.target.value)}
                placeholder="Перевод примера"
                rows={2}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-caps text-on-surface-variant mb-sm">
              Заметки
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные заметки"
              rows={2}
              className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-md">
          <Link
            href={`/decks/${deckId}`}
            className="px-6 py-3 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !term.trim() || !translation.trim()}
            className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
