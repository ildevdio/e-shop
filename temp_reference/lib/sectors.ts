import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Headset,
  Contact,
  ClipboardList,
  PackageCheck,
  Route,
  ScanLine,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SectorId = "comercial" | "separacao" | "logistica" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SectorDef {
  id: SectorId;
  label: string;
  /** Short role description shown under the user name */
  role: string;
  /** Sector-specific navigation items */
  nav: NavItem[];
}

/** Items available to every sector */
export const GENERAL_NAV: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat interno", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Empresa", href: "/dashboard/empresa", icon: Building2 },
];

export const SECTORS: Record<SectorId, SectorDef> = {
  comercial: {
    id: "comercial",
    label: "Comercial",
    role: "Atendimento e pedidos",
    nav: [
      { label: "Atendimento", href: "/dashboard/atendimento", icon: Headset },
      { label: "Contatos", href: "/dashboard/contatos", icon: Contact },
      { label: "Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
    ],
  },
  separacao: {
    id: "separacao",
    label: "Produção / Separação",
    role: "Separação de pedidos",
    nav: [
      {
        label: "Separação",
        href: "/dashboard/separacao",
        icon: PackageCheck,
      },
    ],
  },
  logistica: {
    id: "logistica",
    label: "Logística",
    role: "Rotas, conferência e entrega",
    nav: [
      { label: "Rotas", href: "/dashboard/rotas", icon: Route },
      { label: "Conferência", href: "/dashboard/conferencia", icon: ScanLine },
      { label: "Entrega", href: "/dashboard/entrega", icon: Truck },
    ],
  },
  admin: {
    id: "admin",
    label: "Administração",
    role: "Administrador master",
    nav: [
      { label: "Configurações", href: "/dashboard/configuracoes", icon: Users },
    ],
  },
};

export const SECTOR_ORDER: SectorId[] = [
  "comercial",
  "separacao",
  "logistica",
  "admin",
];
