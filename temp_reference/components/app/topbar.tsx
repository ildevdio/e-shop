"use client";

import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { SECTORS, SECTOR_ORDER, type SectorId } from "@/lib/sectors";
import { useSession } from "./session-provider";

export function Topbar() {
  const { user, setSector } = useSession();
  const router = useRouter();
  const sector = SECTORS[user.sector];
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {sector.label}
        </h1>
        <p className="text-sm text-muted-foreground">{sector.role}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Alternador de setor (temporário — demonstração da Fase 1) */}
        <label className="relative hidden items-center sm:flex">
          <span className="sr-only">Setor de demonstração</span>
          <select
            value={user.sector}
            onChange={(e) => setSector(e.target.value as SectorId)}
            className="appearance-none rounded-md border border-border bg-secondary py-2 pl-3 pr-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Trocar setor de demonstração"
          >
            {SECTOR_ORDER.map((id) => (
              <option key={id} value={id}>
                {SECTORS[id].label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </label>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{sector.label}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
