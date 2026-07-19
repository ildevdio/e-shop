"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GENERAL_NAV, SECTORS } from "@/lib/sectors";
import { useSession } from "./session-provider";

export function Sidebar() {
  const { user } = useSession();
  const pathname = usePathname();
  const sector = SECTORS[user.sector];

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo → atalho para a Home */}
      <div className="flex h-20 items-center border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent"
          aria-label="Ir para o início"
        >
          <Image
            src="/multigraos-logo.png"
            alt="Multigrãos"
            width={44}
            height={44}
            className="h-11 w-11 object-contain mix-blend-lighten"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold tracking-wide text-sidebar-foreground">
              Multigrãos
            </span>
            <span className="text-xs text-sidebar-muted">Sistema Interno</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup label="Geral" items={GENERAL_NAV} pathname={pathname} />
        <NavGroup
          label={sector.label}
          items={sector.nav}
          pathname={pathname}
          className="mt-6"
        />
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-xs text-sidebar-muted">Versão 0.1 — Fase 1</p>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  className,
}: {
  label: string;
  items: typeof GENERAL_NAV;
  pathname: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
        {label}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent",
                  active
                    ? "bg-sidebar-active font-medium text-sidebar-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-1 shrink-0 rounded-full transition-colors",
                    active ? "bg-sidebar-accent" : "bg-transparent",
                  )}
                  aria-hidden="true"
                />
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
