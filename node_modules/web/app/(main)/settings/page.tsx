"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Download, Upload, Trash2, Save } from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettingsStore();

  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Загрузка...</div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettings({
      nativeLanguage: formData.get("nativeLanguage") as string,
      learningLanguage: formData.get("learningLanguage") as string,
      dailyGoalNew: Number(formData.get("dailyGoalNew")),
      dailyGoalReview: Number(formData.get("dailyGoalReview")),
      shuffleDefault: formData.get("shuffleDefault") === "true",
      ttsVoiceId: (formData.get("ttsVoiceId") as string) || null,
    });
  };

  const handleExport = async () => {
    const { deckRepo, cardRepo, settingsRepo, statsRepo } = await import("@/lib/db/repositories");
    const [decks, cards, settings, dailyStats] = await Promise.all([
      deckRepo.getAll(),
      (await import("@/lib/db/db")).db.cards.toArray(),
      settingsRepo.get(),
      (await import("@/lib/db/db")).db.dailyStats.toArray(),
    ]);

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      decks,
      cards,
      dailyStats,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clickspeak-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.decks || !data.cards) {
        alert("Неверный формат файла");
        return;
      }

      const db = (await import("@/lib/db/db")).db;
      await db.transaction("rw", db.decks, db.cards, db.dailyStats, db.settings, async () => {
        if (data.settings) await db.settings.put(data.settings);
        if (data.decks?.length) await db.decks.bulkPut(data.decks);
        if (data.cards?.length) await db.cards.bulkPut(data.cards);
        if (data.dailyStats?.length) await db.dailyStats.bulkPut(data.dailyStats);
      });

      alert("Данные импортированы успешно");
      window.location.reload();
    } catch (error) {
      alert("Ошибка при импорте: " + (error instanceof Error ? error.message : "Неверный формат файла"));
    }
  };

  const handleClearData = async () => {
    if (confirm("Вы уверены? Все данные будут удалены без возможности восстановления.")) {
      const db = (await import("@/lib/db/db")).db;
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-xl">
      <h1 className="text-headline-lg text-on-surface">Настройки</h1>

      <form onSubmit={handleSave} className="space-y-xl">
        <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <h2 className="text-headline-md text-on-surface mb-lg">Языки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Родной язык
              </label>
              <select
                name="nativeLanguage"
                defaultValue={settings.nativeLanguage}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Изучаемый язык
              </label>
              <select
                name="learningLanguage"
                defaultValue={settings.learningLanguage}
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <h2 className="text-headline-md text-on-surface mb-lg">Ежедневные цели</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Новых слов в день
              </label>
              <input
                type="number"
                name="dailyGoalNew"
                defaultValue={settings.dailyGoalNew}
                min="1"
                max="50"
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                Повторений в день
              </label>
              <input
                type="number"
                name="dailyGoalReview"
                defaultValue={settings.dailyGoalReview}
                min="1"
                max="100"
                className="w-full px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
          <h2 className="text-headline-md text-on-surface mb-lg">Обучение</h2>
          <div className="space-y-lg">
            <div className="flex items-center gap-sm">
              <input
                type="checkbox"
                name="shuffleDefault"
                id="shuffleDefault"
                defaultChecked={settings.shuffleDefault}
                className="w-5 h-5 rounded border-outline"
              />
              <label htmlFor="shuffleDefault" className="text-body-md text-on-surface">
                Перемешивать карточки по умолчанию
              </label>
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-sm">
                TTS голос
              </label>
              <select
                name="ttsVoiceId"
                defaultValue={settings.ttsVoiceId || ""}
                title="TTS голос"
                className="w-full max-w-xs px-4 py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">По умолчанию</option>
                <option value="en-US-JennyNeural">English (Jenny)</option>
                <option value="en-US-GuyNeural">English (Guy)</option>
                <option value="es-ES-ElviraNeural">Español (Elvira)</option>
                <option value="fr-FR-DeniseNeural">Français (Denise)</option>
                <option value="de-DE-KatjaNeural">Deutsch (Katja)</option>
                <option value="ru-RU-SvetlanaNeural">Русский (Svetlana)</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-sm bg-primary text-on-primary px-6 py-3 rounded-lg text-interactive-btn hover:opacity-90 transition-opacity"
          >
            <Save className="w-5 h-5" />
            Сохранить
          </button>
        </div>
      </form>

      <section className="bg-surface-container-lowest rounded-lg p-lg card-shadow">
        <h2 className="text-headline-md text-on-surface mb-lg">Данные</h2>
        <div className="flex flex-wrap gap-md">
          <button
            onClick={handleExport}
            className="flex items-center gap-sm border border-outline px-4 py-2 rounded-lg text-interactive-btn text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Download className="w-5 h-5" />
            Экспорт JSON
          </button>
          <label className="flex items-center gap-sm border border-outline px-4 py-2 rounded-lg text-interactive-btn text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Импорт JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleClearData}
            className="flex items-center gap-sm border border-error px-4 py-2 rounded-lg text-interactive-btn text-error hover:bg-error-container transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Удалить все данные
          </button>
        </div>
      </section>
    </div>
  );
}
