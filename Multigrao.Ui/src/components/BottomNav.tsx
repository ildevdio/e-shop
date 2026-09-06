import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, Truck, MessageSquare, Menu, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { getSlug } from '../services/tenantSetup';

export default function BottomNav() {
  const { role, setores } = useAuthStore();
  const { setSidebarAberta } = useUiStore();
  const location = useLocation();
  const slug = getSlug();
  const base = slug ? `/${slug}` : '';

  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const hasSetor = (nome: string) => setores.some(s => normalize(s) === normalize(nome));

  const navItems = [];

  // Home is always available
  navItems.push({ icon: Home, label: 'Início', path: '/' });

  // Add contextual primary actions based on sector
  if (isAdmin || hasSetor('Comercial') || hasSetor('Vendedor')) {
    navItems.push({ icon: MessageSquare, label: 'Comercial', path: '/comercial' });
  }
  
  if (isAdmin || hasSetor('Separação')) {
    navItems.push({ icon: Package, label: 'Separação', path: '/separacao' });
  }

  if (isAdmin || hasSetor('Entregas') || hasSetor('Logística')) {
    navItems.push({ icon: Truck, label: 'Entregas', path: '/entregas' });
  }

  if (navItems.length < 4) {
    navItems.push({ icon: LayoutGrid, label: 'Catálogo', path: '/catalogo' });
  }

  // Ensure we don't have more than 4 items (the 5th is the Menu)
  const displayItems = navItems.slice(0, 4);

  const isActive = (path: string) => {
    const full = `${base}${path === '/' ? '' : path}`;
    if (path === '/') return location.pathname === full;
    return location.pathname === full || location.pathname.startsWith(full + '/');
  };

  if (slug === 'focus') return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center px-8 pb-[max(env(safe-area-inset-bottom),16px)] pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-card/90 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        {displayItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`${base}${item.path === '/' ? '' : item.path}`}
              title={item.label}
              className={`group flex items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-1 hover:bg-accent/60 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${active ? 'bg-primary/10' : 'group-hover:bg-accent'}`}>
                <Icon className={`h-5 w-5 ${active ? 'fill-primary/20 stroke-primary' : ''}`} />
              </div>
            </NavLink>
          );
        })}

        <div className="mx-1.5 h-9 w-px bg-border" />

        <button
          type="button"
          onClick={() => setSidebarAberta(true)}
          title="Menu"
          className="group flex items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:-translate-y-1 hover:text-foreground hover:bg-accent/60"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full group-hover:bg-accent">
            <Menu className="h-5 w-5" />
          </div>
        </button>
      </nav>
    </div>
  );
}
