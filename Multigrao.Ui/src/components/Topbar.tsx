import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const SECTOR_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/comercial': 'Comercial — Atendimento',
  '/comercial/pedidos': 'Comercial — Pedidos',
  '/comercial/clientes': 'Comercial — Clientes',
  '/comercial/contatos': 'Comercial — Contatos',
  '/comercial/lista-atendimentos': 'Comercial — Atendimentos',
  '/separacao': 'Separação',
  '/logistica/roteirizacao': 'Logística — Roteirização',
  '/logistica/veiculos': 'Logística — Veículos',
  '/conferencia': 'Conferência',
  '/entregas': 'Entregas',
  '/chat': 'Chat Interno',
  '/empresa': 'Mural da Empresa',
  '/empresa/avisos': 'Empresa — Avisos',
  '/empresa/enquetes': 'Empresa — Enquetes',
  '/configuracoes': 'Configurações',
};

interface TopbarProps {
  className?: string;
}

export default function Topbar({ className }: TopbarProps) {
  const { nome, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = (nome || 'U')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const sectorLabel = SECTOR_LABELS[location.pathname] || 'Sistema';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className={`sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-secondary/50 px-6 backdrop-blur transition-all duration-300 ${className ?? ''}`.trim()}>
      <h1 className="text-sm font-heading font-semibold text-foreground">{sectorLabel}</h1>

      <div className="flex items-center gap-3 border-l border-border pl-4">
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-foreground leading-tight">{nome}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
