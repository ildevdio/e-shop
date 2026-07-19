"use client";

import {
  TrendingUp,
  TrendingDown,
  type LucideIcon,
  ClipboardList,
  Headset,
  Printer,
  DollarSign,
  Boxes,
  PackageCheck,
  Truck,
  Route,
  ScanLine,
  Users,
  Megaphone,
} from "lucide-react";
import { SECTORS } from "@/lib/sectors";
import { useSession } from "./session-provider";

interface Kpi {
  label: string;
  value: string;
  hint: string;
  trend?: { dir: "up" | "down"; value: string };
  icon: LucideIcon;
}

const KPIS_BY_SECTOR: Record<string, Kpi[]> = {
  comercial: [
    { label: "Pedidos abertos", value: "18", hint: "aguardando produção", icon: ClipboardList, trend: { dir: "up", value: "+4 hoje" } },
    { label: "Atendimentos pendentes", value: "7", hint: "na fila do chat", icon: Headset },
    { label: "Pedidos impressos", value: "12", hint: "enviados p/ separação", icon: Printer, trend: { dir: "up", value: "+3" } },
    { label: "Faturamento do dia", value: "R$ 24,8k", hint: "vs. ontem", icon: DollarSign, trend: { dir: "down", value: "-6%" } },
  ],
  separacao: [
    { label: "Pedidos em aberto", value: "9", hint: "aguardando separação", icon: Boxes },
    { label: "Itens a separar", value: "134", hint: "distribuídos nos pedidos", icon: ClipboardList },
    { label: "Concluídos hoje", value: "21", hint: "prontos p/ entrega", icon: PackageCheck, trend: { dir: "up", value: "+8" } },
  ],
  logistica: [
    { label: "Entregas do dia", value: "14", hint: "programadas", icon: Truck, trend: { dir: "up", value: "+2" } },
    { label: "Rotas ativas", value: "5", hint: "veículos em campo", icon: Route },
    { label: "Pendentes de conferência", value: "3", hint: "aguardando QR Code", icon: ScanLine },
    { label: "Em entrega", value: "6", hint: "motoristas na rua", icon: Truck },
  ],
  admin: [
    { label: "Usuários ativos", value: "27", hint: "em 4 setores", icon: Users },
    { label: "Setores", value: "4", hint: "Comercial, Logística...", icon: Boxes },
    { label: "Avisos publicados", value: "3", hint: "no mural da empresa", icon: Megaphone },
  ],
};

const FLOW = [
  "Comercial",
  "Em produção",
  "Separação",
  "Pronto p/ entrega",
  "Roteirização",
  "Conferência",
  "Entrega",
  "Entregue",
];

export function DashboardHome() {
  const { user } = useSession();
  const sector = SECTORS[user.sector];
  const kpis = KPIS_BY_SECTOR[user.sector] ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h2 className="text-balance text-2xl font-semibold text-foreground">
          Bem-vindo(a), {user.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Indicadores do setor {sector.label} para hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground">
          Fluxo do pedido
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Do atendimento comercial até a entrega final ao cliente.
        </p>
        <ol className="flex flex-wrap items-center gap-2">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {step}
              </span>
              {i < FLOW.length - 1 && (
                <span className="text-muted-foreground" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Os módulos deste setor serão construídos nas próximas fases. Use o
          seletor de setor no topo para pré-visualizar a navegação de cada
          perfil.
        </p>
      </section>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
        </div>
        {kpi.trend && (
          <span
            className={
              kpi.trend.dir === "up"
                ? "flex items-center gap-1 text-xs font-medium text-[var(--success)]"
                : "flex items-center gap-1 text-xs font-medium text-[var(--destructive)]"
            }
          >
            {kpi.trend.dir === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {kpi.trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold text-foreground">{kpi.value}</p>
      <p className="text-sm font-medium text-foreground">{kpi.label}</p>
      <p className="text-xs text-muted-foreground">{kpi.hint}</p>
    </div>
  );
}
