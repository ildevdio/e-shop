import { create } from 'zustand';
import { tenantHeaders } from '../services/tenantSetup';

export interface ConfiguracaoSistema {
  slug: string;
  nomeEmpresa: string;
  cnpj: string;
  slogan: string;
  endereco: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  logoUrl: string;
  videoUrl: string | null;
  corPrincipal: string;
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

export const CONFIG_PADRAO: ConfiguracaoSistema = {
  slug: 'multigraos',
  nomeEmpresa: 'Multigrãos',
  cnpj: '',
  slogan: 'Amendoim & Especiarias',
  endereco: 'Centro — Paulista — PE',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  logoUrl: '/multigraos-logo.png',
  videoUrl: '/multigraosvid.mp4',
  corPrincipal: '#0a0a0a',
};

function luminancia(hex: string): number {
  const m = hex.replace('#', '').trim();
  if (!m || (m.length !== 3 && m.length !== 6)) return 0;
  const v = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  if (Number.isNaN(v)) return 0;
  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function rgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').trim();
  const v = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  if (Number.isNaN(v)) return [0, 0, 0];
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex: string, fator: number): string {
  const [r, g, b] = rgb(hex).map(c => {
    const v = Math.round(c + 255 * fator);
    return Math.max(0, Math.min(255, v));
  });
  return `rgb(${r}, ${g}, ${b})`;
}

interface SistemaStore {
  config: ConfiguracaoSistema;
  carregada: boolean;
  carregando: boolean;
  carregar: () => Promise<void>;
  atualizar: (dados: Partial<ConfiguracaoSistema>) => void;
  salvar: (dados?: Partial<ConfiguracaoSistema>) => Promise<boolean>;
  aplicarTema: (corPrincipal?: string) => void;
}

export const useSistemaStore = create<SistemaStore>((set, get) => ({
  config: CONFIG_PADRAO,
  carregada: false,
  carregando: false,

  carregar: async () => {
    if (get().carregando) return;
    set({ carregando: true });
    try {
      const resp = await fetch(`${API_URL}/Configuracoes`, { headers: tenantHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        const config = {
          slug: data.slug || CONFIG_PADRAO.slug,
          nomeEmpresa: data.nomeEmpresa || CONFIG_PADRAO.nomeEmpresa,
          cnpj: data.cnpj ?? CONFIG_PADRAO.cnpj,
          slogan: data.slogan ?? CONFIG_PADRAO.slogan,
          endereco: data.endereco ?? CONFIG_PADRAO.endereco,
          cep: data.cep ?? '',
          logradouro: data.logradouro ?? '',
          numero: data.numero ?? '',
          bairro: data.bairro ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
          logoUrl: data.logoUrl || CONFIG_PADRAO.logoUrl,
          videoUrl: data.videoUrl ?? null,
          corPrincipal: data.corPrincipal || CONFIG_PADRAO.corPrincipal,
        };
        set({ config, carregada: true });
        get().aplicarTema(config.corPrincipal);
      }
    } catch {
      set({ carregada: true });
    } finally {
      set({ carregando: false });
    }
  },

  atualizar: (dados) => {
    const config = { ...get().config, ...dados };
    set({ config });
    if (dados.corPrincipal) get().aplicarTema(dados.corPrincipal);
  },

  salvar: async (dados) => {
    const config = { ...get().config, ...(dados ?? {}) };
    try {
      const resp = await fetch(`${API_URL}/Configuracoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
        body: JSON.stringify({
          nomeEmpresa: config.nomeEmpresa,
          cnpj: config.cnpj,
          slogan: config.slogan,
          endereco: config.endereco,
          cep: config.cep,
          logradouro: config.logradouro,
          numero: config.numero,
          bairro: config.bairro,
          cidade: config.cidade,
          estado: config.estado,
          logoUrl: config.logoUrl,
          videoUrl: config.videoUrl,
          corPrincipal: config.corPrincipal,
        }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      const atualizada = {
        slug: data.slug || config.slug,
        nomeEmpresa: data.nomeEmpresa || config.nomeEmpresa,
        cnpj: data.cnpj ?? config.cnpj,
        slogan: data.slogan ?? config.slogan,
        endereco: data.endereco ?? config.endereco,
        cep: data.cep ?? '',
        logradouro: data.logradouro ?? '',
        numero: data.numero ?? '',
        bairro: data.bairro ?? '',
        cidade: data.cidade ?? '',
        estado: data.estado ?? '',
        logoUrl: data.logoUrl || config.logoUrl,
        videoUrl: data.videoUrl ?? null,
        corPrincipal: data.corPrincipal || config.corPrincipal,
      };
      set({ config: atualizada });
      get().aplicarTema(atualizada.corPrincipal);
      return true;
    } catch {
      return false;
    }
  },

  aplicarTema: (corPrincipal) => {
    const cor = corPrincipal ?? get().config.corPrincipal;
    const foreground = luminancia(cor) > 0.55 ? '#0a0a0a' : '#fafafa';
    const active = shade(cor, luminancia(cor) > 0.55 ? -0.14 : 0.16);
    const border = rgba(foreground, 0.14);
    const muted = rgba(foreground, 0.6);
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cor);
    root.style.setProperty('--color-primary-foreground', foreground);
    root.style.setProperty('--color-accent', cor);
    root.style.setProperty('--color-accent-foreground', foreground);
    root.style.setProperty('--color-ring', cor);
    root.style.setProperty('--color-sidebar', cor);
    root.style.setProperty('--color-sidebar-foreground', foreground);
    root.style.setProperty('--color-sidebar-active', active);
    root.style.setProperty('--color-sidebar-border', border);
    root.style.setProperty('--color-sidebar-muted', muted);
    root.style.setProperty('--color-sidebar-accent', foreground);
  },
}));
