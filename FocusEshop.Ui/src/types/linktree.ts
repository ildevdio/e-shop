export type LinktreeTemaFundo = 'claro' | 'escuro' | 'gradiente' | 'imagem';
export type LinktreeFormatoBotao = 'cheio' | 'outline' | 'soft';
export type LinktreeFormatoAvatar = 'circular' | 'arredondado' | 'quadrado';
export type LinktreeFonteTitulo = 'padrao' | 'serifada';

export interface LinktreeAparencia {
  temaFundo: LinktreeTemaFundo;
  corFundo1: string;
  corFundo2: string;
  imagemFundoUrl: string;
  escurecerImagem: number;
  formatoBotao: LinktreeFormatoBotao;
  raioBotao: number;
  sombraBotao: boolean;
  formatoAvatar: LinktreeFormatoAvatar;
  mostrarSlogan: boolean;
  fonteTitulo: LinktreeFonteTitulo;
}

export const LINKTREE_APARENCIA_PADRAO: LinktreeAparencia = {
  temaFundo: 'claro',
  corFundo1: '#f9fafb',
  corFundo2: '#10b981',
  imagemFundoUrl: '',
  escurecerImagem: 40,
  formatoBotao: 'cheio',
  raioBotao: 12,
  sombraBotao: true,
  formatoAvatar: 'circular',
  mostrarSlogan: true,
  fonteTitulo: 'padrao',
};

const TEMAS_VALIDOS: LinktreeTemaFundo[] = ['claro', 'escuro', 'gradiente', 'imagem'];
const BOTOES_VALIDOS: LinktreeFormatoBotao[] = ['cheio', 'outline', 'soft'];
const AVATARS_VALIDOS: LinktreeFormatoAvatar[] = ['circular', 'arredondado', 'quadrado'];
const FONTES_VALIDAS: LinktreeFonteTitulo[] = ['padrao', 'serifada'];

export function parseLinktreeAparencia(raw?: string | null): LinktreeAparencia {
  if (!raw) return { ...LINKTREE_APARENCIA_PADRAO };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...LINKTREE_APARENCIA_PADRAO };
    const p = parsed as Record<string, unknown>;
    return {
      temaFundo: TEMAS_VALIDOS.includes(p.temaFundo as LinktreeTemaFundo) ? (p.temaFundo as LinktreeTemaFundo) : LINKTREE_APARENCIA_PADRAO.temaFundo,
      corFundo1: typeof p.corFundo1 === 'string' && p.corFundo1 ? p.corFundo1 : LINKTREE_APARENCIA_PADRAO.corFundo1,
      corFundo2: typeof p.corFundo2 === 'string' && p.corFundo2 ? p.corFundo2 : LINKTREE_APARENCIA_PADRAO.corFundo2,
      imagemFundoUrl: typeof p.imagemFundoUrl === 'string' ? p.imagemFundoUrl : '',
      escurecerImagem: typeof p.escurecerImagem === 'number' ? Math.min(100, Math.max(0, p.escurecerImagem)) : LINKTREE_APARENCIA_PADRAO.escurecerImagem,
      formatoBotao: BOTOES_VALIDOS.includes(p.formatoBotao as LinktreeFormatoBotao) ? (p.formatoBotao as LinktreeFormatoBotao) : LINKTREE_APARENCIA_PADRAO.formatoBotao,
      raioBotao: typeof p.raioBotao === 'number' ? Math.min(40, Math.max(0, p.raioBotao)) : LINKTREE_APARENCIA_PADRAO.raioBotao,
      sombraBotao: typeof p.sombraBotao === 'boolean' ? p.sombraBotao : LINKTREE_APARENCIA_PADRAO.sombraBotao,
      formatoAvatar: AVATARS_VALIDOS.includes(p.formatoAvatar as LinktreeFormatoAvatar) ? (p.formatoAvatar as LinktreeFormatoAvatar) : LINKTREE_APARENCIA_PADRAO.formatoAvatar,
      mostrarSlogan: typeof p.mostrarSlogan === 'boolean' ? p.mostrarSlogan : LINKTREE_APARENCIA_PADRAO.mostrarSlogan,
      fonteTitulo: FONTES_VALIDAS.includes(p.fonteTitulo as LinktreeFonteTitulo) ? (p.fonteTitulo as LinktreeFonteTitulo) : LINKTREE_APARENCIA_PADRAO.fonteTitulo,
    };
  } catch {
    return { ...LINKTREE_APARENCIA_PADRAO };
  }
}
