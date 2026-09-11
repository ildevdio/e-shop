import { useEffect, useState } from 'react';
import { Building2, Check, ChevronDown, LogOut } from 'lucide-react';
import { useAuthStore, type EmpresaInfo } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { getSlug, isShopDomain, tenantHeaders, authHeaders } from '../services/tenantSetup';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

const SECTOR_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/comercial': 'Comercial — Atendimento',
  '/comercial/pedidos': 'Comercial — Pedidos',
  '/comercial/clientes': 'Comercial — Clientes',
  '/comercial/contatos': 'Comercial — Contatos',
  '/comercial/lista-atendimentos': 'Comercial — Atendimentos',
  '/comercial/promocoes': 'Comercial — Promoções',
  '/comercial/cupons': 'Comercial — Cupons',
  '/relatorios': 'Relatórios',
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
  '/configuracoes/bots': 'Configurações — Bots de Atendimento',
  '/empresas': 'Cadastro de Empresas',
  '/empresas/nova': 'Cadastro de Empresas — Nova',
};

interface TopbarProps {
  className?: string;
}

export default function Topbar({ className }: TopbarProps) {
  const { nome, role, empresas, setSessaoEmpresa, logout } = useAuthStore();
  const { modalAberto } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    const sincronizarEmpresas = async () => {
      if (!useAuthStore.getState().token) return;
      try {
        const resp = await fetch(`${API_URL}/Auth/minhas-empresas`, {
          headers: { ...authHeaders(), ...tenantHeaders() },
        });
        if (!resp.ok) return;
        const data: EmpresaInfo[] = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setSessaoEmpresa(useAuthStore.getState().token!, data);
        }
      } catch {
        // mantém lista atual
      }
    };
    sincronizarEmpresas();
  }, [setSessaoEmpresa]);

  const initials = (nome || 'U')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const slug = getSlug();
  const pathSemSlug = slug ? location.pathname.replace(`/${slug}`, '') || '/' : location.pathname;
  const sectorLabel = SECTOR_LABELS[pathSemSlug] || 'Sistema';

  const empresaAtual = empresas.find(e => e.slug === slug) ?? null;
  const matrizIdAtual = empresaAtual ? (empresaAtual.empresaMatrizId ?? empresaAtual.id) : null;
  const grupoEmpresas = matrizIdAtual == null
    ? empresas
    : empresas.filter(e => e.id === matrizIdAtual || e.empresaMatrizId === matrizIdAtual);
  const outrasEmpresas = grupoEmpresas.filter(e => e.slug !== slug);

  const trocarEmpresa = async (empresa: EmpresaInfo) => {
    if (trocando) return;
    setTrocando(true);
    try {
      const resp = await fetch(`${API_URL}/Auth/trocar-empresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...tenantHeaders() },
        body: JSON.stringify({ empresaId: empresa.id }),
      });
      if (!resp.ok) throw new Error('falha ao trocar de empresa');
      const data = await resp.json();
      setSessaoEmpresa(data.token, data.empresas);
      const destino = pathSemSlug === '/' ? '' : pathSemSlug;
      window.location.assign(`/${data.slug}${destino}`);
    } catch {
      setTrocando(false);
      setSeletorAberto(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(isShopDomain() ? '/login' : `/${slug}/login`);
  };

  return (
    <header className={`sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b px-3 backdrop-blur transition-all duration-300 sm:px-6 ${modalAberto ? 'pointer-events-none border-transparent bg-transparent' : 'border-border bg-secondary/50'} ${className ?? ''}`.trim()}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <h1 className={`truncate text-sm font-heading font-semibold transition-colors ${modalAberto ? 'text-white' : 'text-foreground'}`}>{sectorLabel}</h1>
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-3 sm:pl-4">
        {outrasEmpresas.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSeletorAberto(v => !v)}
              disabled={trocando}
              className={`flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors sm:max-w-[220px] ${
                modalAberto
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-border bg-muted/60 text-foreground hover:bg-muted'
              }`}
              title="Trocar filial"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden truncate sm:inline">{empresaAtual?.nomeEmpresa ?? 'Empresa'}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>

            {seletorAberto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSeletorAberto(false)} />
                <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                  <p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {trocando ? 'Trocando...' : 'Empresas e filiais'}
                  </p>
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {[...(empresaAtual ? [empresaAtual] : []), ...outrasEmpresas].map((emp) => {
                      const isAtual = emp.slug === slug;
                      return (
                        <li key={emp.id}>
                          <button
                            type="button"
                            onClick={() => !isAtual && trocarEmpresa(emp)}
                            disabled={isAtual || trocando}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                              isAtual
                                ? 'bg-accent/50 font-medium text-foreground'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">{emp.nomeEmpresa}</span>
                            {!isAtual && emp.empresaMatrizId != null && (
                              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Filial</span>
                            )}
                            {isAtual && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

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
