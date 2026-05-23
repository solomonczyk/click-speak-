"use client";

import { useEffect } from "react";
import { SideNav } from "@/components/ui/side-nav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FAB } from "@/components/features/fab";
import { useSettingsStore } from "@/stores/use-settings-store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex min-h-screen">
      <SideNav />
      <main className="flex-1 md:ml-0 pb-16 md:pb-0">
        <div className="max-w-container mx-auto px-gutter py-lg">
          {children}
        </div>
      </main>
      <BottomNav />
      <FAB />
    </div>
  );
}
