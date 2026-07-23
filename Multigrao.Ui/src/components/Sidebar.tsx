import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Settings, MessageSquare, Package, Map, CheckSquare, Truck,
  Bell, Users, Contact, ClipboardList, Wheat, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import GrainPattern from './GrainPattern';
import { entregaService } from '../services/entregaService';

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
    sectorNav.push(
      { icon: MessageSquare, label: 'Atendimento', path: '/comercial' },
      { icon: Contact, label: 'Contatos', path: '/comercial/contatos' },
      { icon: Users, label: 'Clientes', path: '/comercial/clientes' },
      { icon: ClipboardList, label: 'Pedidos', path: '/comercial/pedidos' },
      { icon: ClipboardList, label: 'Atendimentos', path: '/comercial/lista-atendimentos' },
    );
  }
  if (isAdmin || hasSetor('Separação')) sectorNav.push({ icon: Package, label: 'Separação', path: '/separacao' });
  if (isAdmin || hasSetor('Logística')) {
    sectorNav.push(
      { icon: Map, label: 'Roteirização', path: '/logistica/roteirizacao' },
      { icon: Truck, label: 'Veículos', path: '/logistica/veiculos' },
    );
  }
  if (isAdmin || hasSetor('Conferência')) sectorNav.push({ icon: CheckSquare, label: 'Conferência', path: '/conferencia' });
  if (isAdmin || hasSetor('Entregas') || temEntregasPendentes) {
    if (!sectorNav.some(i => i.path === '/entregas')) {
      sectorNav.push({ icon: Truck, label: 'Entregas', path: '/entregas' });
    }
  }

  const comNav: NavItem[] = [
    { icon: MessageSquare, label: 'Chat Interno', path: '/chat' },
    { icon: Bell, label: 'Mural da Empresa', path: '/empresa' },
  ];

  const sysNav: NavItem[] = [];
  if (isAdmin || hasSetor('Compras')) {
    sysNav.push({ icon: Settings, label: 'Configurações', path: '/configuracoes' });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className={`relative flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground anim-slide-in-left transition-all duration-300 ${className ?? ''}`.trim()}>
      <GrainPattern opacity={0.05} color="#404040" className="inset-0 w-full h-full" animated />

      <div className="relative z-10 flex h-16 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-3">
          <img src="/multigraos-logo.png?v=2" alt="Multigrãos" className="h-10 w-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-semibold tracking-wide text-sidebar-foreground">Multigrãos</span>
            <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">Amendoim & Especiarias</span>
          </div>
        </div>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto sidebar-scrollbar px-3 py-4">
        <NavGroup label="Geral" items={generalNav} isActive={isActive} />
        {sectorNav.length > 0 && (
          <NavGroup label="Setores" items={sectorNav} isActive={isActive} className="mt-5" />
        )}
        <NavGroup label="Comunicação" items={comNav} isActive={isActive} className="mt-5" />
        <NavGroup label="Sistema" items={sysNav} isActive={isActive} className="mt-5" />


      </nav>

      <div className="relative z-10 border-t border-sidebar-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Wheat size={10} className="text-sidebar-muted" />
          <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">v0.1 — Fase 1</p>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ label, items, isActive, className }: {
  label: string; items: NavItem[]; isActive: (path: string) => boolean; className?: string;
}) {
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
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 outline-none ${
                  active
                    ? 'bg-sidebar-active font-medium text-sidebar-foreground shadow-sm'
                    : 'text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground'
                }`}
              >
                <span className={`flex h-5 w-1 shrink-0 rounded-full transition-all duration-300 ${
                  active ? 'bg-white' : 'bg-transparent'
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
