import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Settings, MessageSquare, Package, Map, CheckSquare, Truck,
  Bell, Users, Contact, ClipboardList, Wheat, BookOpen, ShieldCheck, Building2, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import GrainPattern from './GrainPattern';
import { entregaService } from '../services/entregaService';
import { useSistemaStore, CONFIG_PADRAO } from '../store/sistemaStore';
import { useUiStore } from '../store/uiStore';
import { getSlug } from '../services/tenantSetup';
import { midiaUrl } from '../utils/imageUrl';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  role: string | null;
  setores: string[];
  usuarioId: number | null;
  className?: string;
}

export default function Sidebar({ role, setores, usuarioId, className }: SidebarProps) {
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const hasSetor = (nome: string) => setores.some(s => normalize(s) === normalize(nome));
  const location = useLocation();
  const [temEntregasPendentes, setTemEntregasPendentes] = useState(false);
  const config = useSistemaStore((state) => state.config);

  const slug = getSlug();
  const base = slug ? `/${slug}` : '';

  useEffect(() => {
    if (!usuarioId) return;
    entregaService.temEntregasPendentes(usuarioId).then(setTemEntregasPendentes);
  }, [usuarioId]);

  const generalNav: NavItem[] = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: BookOpen, label: 'Catálogo', path: '/catalogo' },
  ];

  const sectorNav: NavItem[] = [];
  if (isAdmin || hasSetor('Comercial')) {
    sectorNav.push({ icon: MessageSquare, label: 'Atendimento', path: '/comercial' });
  }
  if (isAdmin || hasSetor('Comercial') || hasSetor('Vendedor')) {
    sectorNav.push(
      { icon: Contact, label: 'Contatos', path: '/comercial/contatos' },
      { icon: Users, label: 'Clientes', path: '/comercial/clientes' },
      { icon: ClipboardList, label: 'Pedidos', path: '/comercial/pedidos' },
    );
  }
  if (isAdmin || hasSetor('Comercial')) {
    sectorNav.push({ icon: ClipboardList, label: 'Atendimentos', path: '/comercial/lista-atendimentos' });
  }
  if (isAdmin || hasSetor('Separação')) sectorNav.push({ icon: Package, label: 'Separação', path: '/separacao' });
  if (isAdmin || hasSetor('Conferência')) sectorNav.push({ icon: CheckSquare, label: 'Conferência', path: '/conferencia' });
  if (isAdmin || hasSetor('Logística')) {
    sectorNav.push(
      { icon: Map, label: 'Logística', path: '/logistica' },
    );
  }
  if (isAdmin || hasSetor('Entregas') || temEntregasPendentes) {
    if (!sectorNav.some(i => i.path === '/entregas')) {
      sectorNav.push({ icon: Truck, label: 'Entregas', path: '/entregas' });
    }
  }
  if (isAdmin || hasSetor('Financeiro')) {
    sectorNav.push({ icon: ShieldCheck, label: 'Financeiro', path: '/financeiro' });
  }

  const comNav: NavItem[] = [
    { icon: MessageSquare, label: 'Chat Interno', path: '/chat' },
    { icon: Bell, label: 'Mural da Empresa', path: '/empresa' },
  ];

  const sysNav: NavItem[] = [];
  if (isAdmin || hasSetor('Compras')) {
    sysNav.push({ icon: Settings, label: 'Configurações', path: '/configuracoes' });
  }

  const focusNav: NavItem[] = [
    { icon: Building2, label: 'Cadastro de Empresas', path: '/empresas' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  const isActive = (path: string) => {
    const full = `${base}${path === '/' ? '' : path}`;
    if (path === '/') return location.pathname === full;
    return location.pathname === full || location.pathname.startsWith(full + '/');
  };

  const { sidebarAberta, setSidebarAberta } = useUiStore();

  useEffect(() => {
    setSidebarAberta(false);
  }, [location.pathname, setSidebarAberta]);

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarAberta ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarAberta(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static lg:translate-x-0 ${
          sidebarAberta ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${className ?? ''}`.trim()}
      >
        <GrainPattern opacity={0.05} color="#404040" className="inset-0 w-full h-full" animated />

        <div className="relative z-10 flex h-16 items-center border-b border-sidebar-border px-5">
          <div className="flex items-center gap-3">
            <img src={midiaUrl(config.logoUrl || CONFIG_PADRAO.logoUrl)} alt={config.nomeEmpresa} className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-heading font-semibold tracking-wide text-sidebar-foreground">{config.nomeEmpresa}</span>
              <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">{config.slogan}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarAberta(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-active/60 hover:text-sidebar-foreground lg:hidden"
            title="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      <nav className="relative z-10 flex-1 overflow-y-auto sidebar-scrollbar px-3 py-4">
        {slug === 'focus' ? (
          <NavGroup label="Plataforma" items={focusNav} isActive={isActive} />
        ) : (
          <>
            <NavGroup label="Geral" items={generalNav} isActive={isActive} />
            {sectorNav.length > 0 && (
              <NavGroup label="Setores" items={sectorNav} isActive={isActive} className="mt-5" />
            )}
            <NavGroup label="Comunicação" items={comNav} isActive={isActive} className="mt-5" />
            <NavGroup label="Sistema" items={sysNav} isActive={isActive} className="mt-5" />
          </>
        )}
      </nav>

      <div className="relative z-10 border-t border-sidebar-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Wheat size={10} className="text-sidebar-muted" />
          <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">v0.1 — Fase 1</p>
        </div>
      </div>
      </aside>
    </>
  );
}

function NavGroup({ label, items, isActive, className }: {
  label: string; items: NavItem[]; isActive: (path: string) => boolean; className?: string;
}) {
  const slug = getSlug();
  const base = slug ? `/${slug}` : '';
  return (
    <div className={className}>
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item, i) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <li key={item.path} className={`anim-slide-in-left anim-delay-${Math.min(i + 1, 6)}`}>
              <NavLink
                to={`${base}${item.path === '/' ? '' : item.path}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 outline-none ${
                  active
                    ? 'bg-sidebar-active font-medium text-sidebar-foreground shadow-sm'
                    : 'text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground'
                }`}
              >
                <span className={`flex h-5 w-1 shrink-0 rounded-full transition-all duration-300 ${
                  active ? 'bg-primary-foreground' : 'bg-transparent'
                }`} />
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
