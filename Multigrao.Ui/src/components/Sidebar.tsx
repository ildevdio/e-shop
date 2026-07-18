import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  MessageSquare, 
  ShoppingCart, 
  Package, 
  Map, 
  CheckSquare, 
  Truck,
  Bell,
  BarChart3,
  ChevronRight,
  Users,
  Navigation,
  Contact,
  ClipboardList,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface MenuItem {
  icon: typeof ShoppingCart;
  label: string;
  path: string;
  children?: Array<{ icon: typeof BarChart3; label: string; path: string }>;
}

interface SidebarProps {
  role: string | null;
  setores: string[];
}

export default function Sidebar({ role, setores }: SidebarProps) {
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const hasSetor = (nome: string) => setores.some(s => normalize(s) === normalize(nome));
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const toggleSector = (sector: string) => {
    setExpandedSectors(prev => ({ ...prev, [sector]: !prev[sector] }));
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const menuGroups: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Menu',
      items: [
        { icon: Home, label: 'Início', path: '/' },
      ]
    }
  ];

  const menuSetores: MenuItem[] = [];

  if (isAdmin || hasSetor('Comercial')) {
    menuSetores.push(
      { icon: MessageSquare, label: 'Atendimento', path: '/comercial' },
      { icon: Contact, label: 'Contatos', path: '/comercial/contatos' },
      { icon: Users, label: 'Clientes', path: '/comercial/clientes' },
      { icon: Navigation, label: 'Pedidos', path: '/comercial/pedidos' },
      { icon: ClipboardList, label: 'Lista de Atendimentos', path: '/comercial/lista-atendimentos' },
    );
  }
  if (isAdmin || hasSetor('Separação')) {
    menuSetores.push({ icon: Package, label: 'Separação', path: '/separacao' });
  }
  if (isAdmin || hasSetor('Logística')) {
    menuSetores.push(
      { icon: Map, label: 'Roteirização', path: '/logistica/roteirizacao' },
      { icon: Truck, label: 'Veículos', path: '/logistica/veiculos' },
    );
  }
  if (isAdmin || hasSetor('Conferência')) {
    menuSetores.push({ icon: CheckSquare, label: 'Conferência', path: '/conferencia' });
  }
  if (isAdmin || hasSetor('Entregas')) {
    menuSetores.push({ icon: Truck, label: 'Entregas', path: '/entregas' });
  }

  if (menuSetores.length > 0) {
    menuGroups.push({ title: 'Setores', items: menuSetores });
  }

  menuGroups.push({
    title: 'Comunicação',
    items: [
      { icon: MessageSquare, label: 'Chat Interno', path: '/chat' },
      { icon: Bell, label: 'Mural da Empresa', path: '/empresa' },
    ]
  });

  if (isAdmin) {
    menuGroups.push({
      title: 'Sistema',
      items: [
        { icon: Settings, label: 'Configurações', path: '/configuracoes' }
      ]
    });
  }

  return (
    <>
      {/* Hamburger button — sits on the corner of the safety border */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 z-[60] w-10 h-10 flex items-center justify-center rounded-xl bg-[#111111] text-white shadow-lg hover:bg-gray-800 transition-all duration-200 active:scale-95"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown panel */}
      <div
        ref={panelRef}
        className={`fixed top-12 left-2 sm:top-[52px] sm:left-3 lg:top-14 lg:left-4 z-[58] w-[280px] bg-[#111111] text-white rounded-2xl shadow-2xl shadow-black/30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-top-left overflow-hidden ${
          isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#111111] font-bold text-sm font-heading">M</span>
            </div>
            <div>
              <h1 className="text-sm font-heading font-bold tracking-wide text-white leading-tight">
                Multigrãos
              </h1>
              <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-medium">Gestão & Logística</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="py-3 px-3 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-1">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-0.5">
              <h2 className="px-3 py-1.5 text-[9px] font-semibold text-gray-600 uppercase tracking-[0.15em]">
                {group.title}
              </h2>
              
              {group.items.map((item, i) => {
                const Icon = item.icon;
                const hasChildren = 'children' in item && item.children && item.children.length > 0;
                const isExpanded = expandedSectors[item.label];

                return (
                  <div key={i}>
                    <NavLink
                      to={item.path}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleSector(item.label);
                        }
                      }}
                      className={({ isActive: linkIsActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group overflow-hidden text-sm ${
                          (linkIsActive && !hasChildren) || (hasChildren && isExpanded)
                            ? 'bg-white/10 text-white font-medium' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      {({ isActive: linkIsActive }) => (
                        <>
                          {(linkIsActive && !hasChildren) || (hasChildren && isExpanded) ? (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
                          ) : null}
                          <Icon size={18} className={(linkIsActive && !hasChildren) || (hasChildren && isExpanded) ? 'text-gray-300' : 'group-hover:text-gray-200 transition-colors'} />
                          <span className="flex-1">{item.label}</span>
                          {hasChildren && (
                            <ChevronRight 
                              size={14} 
                              className={`text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          )}
                        </>
                      )}
                    </NavLink>

                    {hasChildren && (
                      <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-5 pl-3 border-l border-white/10">
                          {item.children!.map((child: { icon: typeof BarChart3; label: string; path: string }, childIdx: number) => {
                            const ChildIcon = child.icon;
                            return (
                              <NavLink
                                key={childIdx}
                                to={child.path}
                                className={({ isActive }) =>
                                  `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                                    isActive
                                      ? 'bg-white/10 text-white font-medium'
                                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                  }`
                                }
                              >
                                <ChildIcon size={14} className="text-gray-600" />
                                <span>{child.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
