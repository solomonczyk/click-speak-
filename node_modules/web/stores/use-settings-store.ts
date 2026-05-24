import { create } from "zustand";
import type { UserSettings } from "@/lib/db/schema";
import { settingsRepo } from "@/lib/db/repositories";

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await settingsRepo.get();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const { settings } = get();
    if (!settings) return;

    try {
      await settingsRepo.update(updates);
      set({ settings: { ...settings, ...updates, updatedAt: new Date().toISOString() } });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  },
}));
