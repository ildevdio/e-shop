"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SectorId } from "@/lib/sectors";

/**
 * TEMPORARY demo session.
 *
 * Fase 1 entrega apenas a camada visual. Enquanto o Better Auth não está
 * configurado (falta a variável BETTER_AUTH_SECRET), usamos uma sessão de
 * demonstração em memória que permite alternar entre os setores para
 * pré-visualizar a navegação de cada perfil. Ao conectar a autenticação real,
 * este provider passa a ler a sessão do servidor.
 */

interface DemoUser {
  name: string;
  email: string;
  sector: SectorId;
}

interface SessionContextValue {
  user: DemoUser;
  setSector: (sector: SectorId) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  initialSector = "comercial",
}: {
  children: React.ReactNode;
  initialSector?: SectorId;
}) {
  const [sector, setSector] = useState<SectorId>(initialSector);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: {
        name: "Usuário Demo",
        email: "demo@multigraos.com.br",
        sector,
      },
      setSector,
    }),
    [sector],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  }
  return ctx;
}
