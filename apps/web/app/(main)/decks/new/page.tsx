"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDecksStore } from "@/stores/use-decks-store";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewDeckPage() {
  const router = useRouter();
  const { createDeck } = useDecksStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ru");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const deck = await createDeck({
        title: title.trim(),
        description: description.trim() || null,
        sourceLang,
        targetLang,
        icon: null,
        coverUrl: null,
      });
      router.push(`/decks/${deck.id}`);
    } catch (error) {
      console.error("Failed to create deck:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-xl">
      <div className="flex items-center gap-sm">
        <Link
          href="/decks"
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-headline-lg text-on-surface">Новая колода</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl max-w-2xl">
        <div className="bg-surface-container-lowest rounded-lg p-lg card-shadow space-y-lg">
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-sm">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Английский для начинающих"
              className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="block text-label-caps text-on-surface-variant mb-sm">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательное описание колоды"
              rows={3}
              className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Язык источника
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
              </select>
            </div>

            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Целевой язык
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-md">
          <Link
            href="/decks"
            className="px-6 py-3 rounded-lg text-interactive-btn text-on-surface border border-outline hover:bg-surface-container-low transition-colors"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? "Сохранение..." : "Создать колоду"}
          </button>
        </div>
      </form>
    </div>
  );
}
