"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, School, Layers, BarChart3, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: School },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container-low border-r border-outline-variant h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-headline-lg text-primary font-semibold">Click&Speak</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-body-md transition-colors",
                isActive
                  ? "text-primary bg-surface-container-high border-r-4 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant">
        <Link
          href="/decks/new"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-md text-primary hover:bg-surface-container-high transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Deck</span>
        </Link>
      </div>
    </aside>
  );
}
