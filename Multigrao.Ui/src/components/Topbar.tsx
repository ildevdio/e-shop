import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { getSlug, isShopDomain } from '../services/tenantSetup';

const SECTOR_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/comercial': 'Comercial — Atendimento',
  '/comercial/pedidos': 'Comercial — Pedidos',
  '/comercial/clientes': 'Comercial — Clientes',
  '/comercial/contatos': 'Comercial — Contatos',
  '/comercial/lista-atendimentos': 'Comercial — Atendimentos',
  '/separacao': 'Separação',
  '/logistica': 'Logística',
  '/conferencia': 'Conferência',
  '/entregas': 'Entregas',
  '/chat': 'Chat Interno',
  '/catalogo': 'Catálogo',
  '/financeiro': 'Financeiro',
  '/empresa': 'Mural da Empresa',
  '/empresa/avisos': 'Empresa — Avisos',
  '/empresa/enquetes': 'Empresa — Enquetes',
  '/configuracoes': 'Configurações',
  '/empresas': 'Cadastro de Empresas',
  '/empresas/nova': 'Cadastro de Empresas — Nova',
};

interface TopbarProps {
  className?: string;
}

export default function Topbar({ className }: TopbarProps) {
  const { nome, role, logout } = useAuthStore();
  const { modalAberto, sidebarAberta, setSidebarAberta } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = (nome || 'U')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const slug = getSlug();
  const pathSemSlug = slug ? location.pathname.replace(`/${slug}`, '') || '/' : location.pathname;
  const sectorLabel = SECTOR_LABELS[pathSemSlug] || 'Sistema';

  const handleLogout = () => {
    logout();
    navigate(isShopDomain() ? '/login' : `/${slug}/login`);
  };

  return (
    <header className={`sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b px-3 backdrop-blur transition-all duration-300 sm:px-6 ${modalAberto ? 'pointer-events-none border-transparent bg-transparent' : 'border-border bg-secondary/50'} ${className ?? ''}`.trim()}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setSidebarAberta(!sidebarAberta)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground lg:hidden ${modalAberto ? 'text-white' : 'text-foreground'}`}
          title="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className={`truncate text-sm font-heading font-semibold transition-colors ${modalAberto ? 'text-white' : 'text-foreground'}`}>{sectorLabel}</h1>
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-3 sm:pl-4">
        <NotificationBell className={modalAberto ? 'text-white/70' : undefined} />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden text-right md:block">
          <p className={`text-sm font-medium transition-colors leading-tight ${modalAberto ? 'text-white' : 'text-foreground'}`}>{nome}</p>
          <p className={`text-[10px] uppercase tracking-wider transition-colors ${modalAberto ? 'text-white/70' : 'text-muted-foreground'}`}>{role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground ${modalAberto ? 'text-white/70' : 'text-muted-foreground'}`}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
