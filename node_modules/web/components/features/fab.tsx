"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { QuickAddModal } from "./quick-add-modal";

export function FAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide during learn session
  if (pathname?.startsWith("/learn")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 z-40 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center"
        aria-label="Быстрое добавление"
      >
        <Plus className="w-7 h-7" />
      </button>
      <QuickAddModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
