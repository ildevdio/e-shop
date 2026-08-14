import { create } from 'zustand';
import { tenantHeaders, getSlug } from '../services/tenantSetup';

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
  fonte: string;
  corSecundaria: string;
  corFonte: string;
  designEcommerce: string;
  tituloHero: string;
  subtextoHero: string;
  exibirNomeAbaixoLogo: boolean;
  tipoMenu: string;
  tipoCarrinho: string;
  linksBio?: string | null;
  redirecionamentos?: string | null;
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

const CHAVE_CONFIG = 'sistemaConfig_' + (getSlug() || 'default');

function lerConfigLocal(): ConfiguracaoSistema | null {
  try {
    const raw = localStorage.getItem(CHAVE_CONFIG);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return { ...CONFIG_PADRAO, ...data };
  } catch {
    return null;
  }
}

function salvarConfigLocal(config: ConfiguracaoSistema) {
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch {
    // armazenamento indisponível — ignora
  }
}

export const FONTES_ECOMMERCE: Record<string, { nome: string; heading: string; corpo: string }> = {
  classica: {
    nome: 'Clássica',
    heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
    corpo: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
  },
  moderna: {
    nome: 'Moderna',
    heading: "'Poppins', 'Segoe UI', sans-serif",
    corpo: "'Inter', 'Segoe UI', sans-serif",
  },
  redonda: {
    nome: 'Redonda',
    heading: "'Nunito Sans', 'Segoe UI', sans-serif",
    corpo: "'Nunito Sans', 'Segoe UI', sans-serif",
  },
  serifa: {
    nome: 'Serifada',
    heading: "'Lora', Georgia, 'Times New Roman', serif",
    corpo: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
  },
  condensada: {
    nome: 'Condensada',
    heading: "'Oswald', 'Arial Narrow', sans-serif",
    corpo: "'Inter', 'Segoe UI', sans-serif",
  },
  minimalista: {
    nome: 'Minimalista',
    heading: "'Inter', 'Segoe UI', sans-serif",
    corpo: "'Inter', 'Segoe UI', sans-serif",
  },
};

export interface EstilosEcommerce {
  navRgb: string;
  navAlphaMax: number;
  navAlphaMin: number;
  navTexto: string;
  navBtnConta: string;
  navBtnCarrinho: string;
  navBtnMenu: string;
  cardClasse: string;
  cardSombra: string;
  botaoClasse: string;
  stepperClasse: string;
  heroOverlay: string;
  tickerClasse: string;
  tituloTransform: string;
}

export interface DesignEcommerce {
  nome: string;
  descricao?: string;
  bg: string;
  card: string;
  surface: string;
  fill: string;
  text: string;
  muted: string;
  border: string;
  strong: string;
  estilos: EstilosEcommerce;
}

export const DESIGNS_ECOMMERCE: Record<string, DesignEcommerce> = {
  claro: {
    nome: 'Classic',
    descricao: 'O visual atual do sistema: elegante, serifado e acolhedor.',
    bg: '#f7f5f2',
    card: '#ffffff',
    surface: '#f7f5f2',
    fill: '#f4f4f5',
    text: '#18181b',
    muted: '#71717a',
    border: 'rgba(24, 24, 27, 0.12)',
    strong: '#18181b',
    estilos: {
      navRgb: '24,24,27',
      navAlphaMax: 0.6,
      navAlphaMin: 0,
      navTexto: '#ffffff',
      navBtnConta: 'backdrop-blur-md bg-white/15 border border-white/40 text-white hover:bg-white/25',
      navBtnCarrinho: 'bg-white text-zinc-900 hover:bg-zinc-100',
      navBtnMenu: 'backdrop-blur-md bg-white/15 border border-white/40 text-white hover:bg-white/25',
      cardClasse: 'rounded-2xl border border-ecom-border',
      cardSombra: 'shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] hover:-translate-y-1',
      botaoClasse: 'rounded-full uppercase tracking-widest',
      stepperClasse: 'rounded-full',
      heroOverlay: 'bg-black/30',
      tickerClasse: 'bg-primary text-primary-foreground',
      tituloTransform: '',
    },
  },
  wild: {
    nome: 'Wild (Naturais)',
    descricao: 'Empório natural com energia comercial: tons terrosos, verde vivo, navegação de categorias em destaque e foco total nas fotos dos produtos.',
    bg: '#f7f4ec',
    card: '#ffffff',
    surface: '#efe9da',
    fill: '#e5dcc6',
    text: '#2c3a2b',
    muted: '#74806f',
    border: 'rgba(44, 58, 43, 0.14)',
    strong: '#1f7a4d',
    estilos: {
      navRgb: '255,255,255',
      navAlphaMax: 0.98,
      navAlphaMin: 0,
      navTexto: '#2c3a2b',
      navBtnConta: 'bg-white/80 border border-[#1f7a4d]/25 text-[#2c3a2b] hover:bg-[#1f7a4d]/10',
      navBtnCarrinho: 'bg-[#1f7a4d] text-white hover:bg-[#185c39]',
      navBtnMenu: 'bg-white/80 border border-[#1f7a4d]/25 text-[#2c3a2b] hover:bg-[#1f7a4d]/10',
      cardClasse: 'rounded-2xl bg-ecom-card border border-[#2c3a2b]/10',
      cardSombra: 'shadow-[0_2px_14px_rgba(44,58,43,0.06)] hover:shadow-[0_16px_32px_rgba(31,122,77,0.18)] hover:-translate-y-1',
      botaoClasse: 'rounded-full uppercase tracking-wider',
      stepperClasse: 'rounded-full',
      heroOverlay: 'bg-gradient-to-t from-black/75 via-black/25 to-transparent',
      tickerClasse: 'bg-[#1f7a4d] text-white',
      tituloTransform: '',
    },
  },
  pop: {
    nome: 'Pop',
    descricao: 'Cores quentes e vibrantes, cantos arredondados e clima de empório. Inspirado na Casas Pedro.',
    bg: '#fff8f0',
    card: '#ffffff',
    surface: '#fff1e0',
    fill: '#ffe3c2',
    text: '#3f1d09',
    muted: '#a05e2c',
    border: 'rgba(159, 93, 44, 0.25)',
    strong: '#7c2d12',
    estilos: {
      navRgb: '255,248,240',
      navAlphaMax: 0.95,
      navAlphaMin: 0.55,
      navTexto: '#3f1d09',
      navBtnConta: 'bg-black/5 border border-black/10 text-[#3f1d09] hover:bg-black/10',
      navBtnCarrinho: 'bg-[#3f1d09] text-[#fff8f0] hover:bg-[#5c2d12]',
      navBtnMenu: 'bg-black/5 border border-black/10 text-[#3f1d09] hover:bg-black/10',
      cardClasse: 'rounded-2xl border-2 border-ecom-border',
      cardSombra: 'shadow-[0_4px_14px_rgba(194,120,60,0.15)] hover:shadow-[0_14px_30px_rgba(194,120,60,0.25)] hover:-translate-y-1',
      botaoClasse: 'rounded-full uppercase tracking-widest',
      stepperClasse: 'rounded-full',
      heroOverlay: 'bg-black/25',
      tickerClasse: 'bg-ecom-secondary text-ecom-secondary-foreground',
      tituloTransform: '',
    },
  },
};

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
  fonte: 'classica',
  corSecundaria: '#f97316',
  corFonte: '',
  designEcommerce: 'claro',
  tituloHero: 'O melhor da natureza para a sua loja.',
  subtextoHero: 'Sua distribuidora de produtos naturais',
  exibirNomeAbaixoLogo: true,
  tipoMenu: 'dock',
  tipoCarrinho: 'pagina',
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
  aplicarTema: () => void;
}

export const useSistemaStore = create<SistemaStore>((set, get) => ({
  config: lerConfigLocal() ?? CONFIG_PADRAO,
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
          logoUrl: data.logoUrl ?? '',
          videoUrl: data.videoUrl ?? null,
          corPrincipal: data.corPrincipal || CONFIG_PADRAO.corPrincipal,
          fonte: data.fonte || CONFIG_PADRAO.fonte,
          corSecundaria: data.corSecundaria || CONFIG_PADRAO.corSecundaria,
          corFonte: data.corFonte ?? CONFIG_PADRAO.corFonte,
          designEcommerce: data.designEcommerce || CONFIG_PADRAO.designEcommerce,
          tituloHero: data.tituloHero || CONFIG_PADRAO.tituloHero,
          subtextoHero: data.subtextoHero ?? null,
          exibirNomeAbaixoLogo: data.exibirNomeAbaixoLogo ?? true,
          tipoMenu: data.tipoMenu || CONFIG_PADRAO.tipoMenu,
          tipoCarrinho: data.tipoCarrinho || CONFIG_PADRAO.tipoCarrinho,
          linksBio: data.linksBio ?? null,
          redirecionamentos: data.redirecionamentos ?? null,
        };
        set({ config, carregada: true });
        salvarConfigLocal(config);
        get().aplicarTema();
      }
    } catch {
      set({ carregada: true });
    } finally {
      set({ carregando: false, carregada: true });
    }
  },

  atualizar: (dados) => {
    const config = { ...get().config, ...dados };
    set({ config });
    salvarConfigLocal(config);
    get().aplicarTema();
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
          fonte: config.fonte,
          corSecundaria: config.corSecundaria,
          corFonte: config.corFonte,
          designEcommerce: config.designEcommerce,
          tituloHero: config.tituloHero,
          subtextoHero: config.subtextoHero,
          exibirNomeAbaixoLogo: config.exibirNomeAbaixoLogo,
          tipoMenu: config.tipoMenu,
          tipoCarrinho: config.tipoCarrinho,
          linksBio: config.linksBio,
          redirecionamentos: config.redirecionamentos,
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
        logoUrl: data.logoUrl ?? config.logoUrl,
        videoUrl: data.videoUrl ?? null,
        corPrincipal: data.corPrincipal || config.corPrincipal,
        fonte: data.fonte || config.fonte,
        corSecundaria: data.corSecundaria || config.corSecundaria,
        corFonte: data.corFonte ?? config.corFonte,
        designEcommerce: data.designEcommerce || config.designEcommerce,
        tituloHero: data.tituloHero || config.tituloHero,
        subtextoHero: data.subtextoHero ?? config.subtextoHero,
        exibirNomeAbaixoLogo: data.exibirNomeAbaixoLogo ?? config.exibirNomeAbaixoLogo,
        tipoMenu: data.tipoMenu || config.tipoMenu,
        tipoCarrinho: data.tipoCarrinho || config.tipoCarrinho,
        linksBio: data.linksBio ?? config.linksBio,
        redirecionamentos: data.redirecionamentos ?? config.redirecionamentos,
      };
      set({ config: atualizada });
      salvarConfigLocal(atualizada);
      get().aplicarTema();
      return true;
    } catch {
      return false;
    }
  },

  aplicarTema: () => {
    const config = get().config;
    const cor = config.corPrincipal || CONFIG_PADRAO.corPrincipal;
    const foreground = luminancia(cor) > 0.55 ? '#0a0a0a' : '#fafafa';
    const active = shade(cor, luminancia(cor) > 0.55 ? -0.14 : 0.16);
    const border = rgba(foreground, 0.14);
    const muted = rgba(foreground, 0.6);

    const secundaria = config.corSecundaria || CONFIG_PADRAO.corSecundaria;
    const secundariaForeground = luminancia(secundaria) > 0.55 ? '#0a0a0a' : '#ffffff';

    const design = DESIGNS_ECOMMERCE[config.designEcommerce] ?? DESIGNS_ECOMMERCE.claro;
    const corFonte = config.corFonte || design.text;
    const fonte = FONTES_ECOMMERCE[config.fonte] ?? FONTES_ECOMMERCE.classica;

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
    root.style.setProperty('--color-ecom-bg', design.bg);
    root.style.setProperty('--color-ecom-card', design.card);
    root.style.setProperty('--color-ecom-surface', design.surface);
    root.style.setProperty('--color-ecom-fill', design.fill);
    root.style.setProperty('--color-ecom-text', corFonte);
    root.style.setProperty('--color-ecom-muted', design.muted);
    root.style.setProperty('--color-ecom-border', design.border);
    root.style.setProperty('--color-ecom-strong', design.strong);
    root.style.setProperty('--color-ecom-secondary', secundaria);
    root.style.setProperty('--color-ecom-secondary-foreground', secundariaForeground);
    root.style.setProperty('--font-heading', fonte.heading);
    root.style.setProperty('--font-body', fonte.corpo);
  },
}));
