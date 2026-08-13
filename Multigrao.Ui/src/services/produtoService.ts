import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Produtos';

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
}

export interface Marca {
  id: number;
  nome: string;
  imagemUrl: string | null;
  imagemContentType: string | null;
  cor: string | null;
}

export interface Produto {
  id: number;
  nome: string;
  pesoUnidade: number;
  codigoERP: string;
  categoriaId: number | null;
  marcaId: number | null;
  categoria?: Categoria | null;
  marca?: Marca | null;
  precoVarejo: number;
  precoAtacado: number;
  quantidadeMinimaAtacado: number;
  vendidoAGranel: boolean;
  embalagem: string | null;
  unidadeVenda: string | null;
  imagemUrl: string | null;
  imagemContentType?: string | null;
  ativo: boolean;
  destaque: boolean;
  estoque: number;
}

export const UNIDADES_MEDIDA = [
  { valor: 'kg', nome: 'Quilo (kg)' },
  { valor: 'g', nome: 'Grama (g)' },
  { valor: 'L', nome: 'Litro (L)' },
  { valor: 'ml', nome: 'Mililitro (ml)' },
  { valor: 'un', nome: 'Unidade (un)' },
  { valor: 'dz', nome: 'Dúzia (dz)' },
  { valor: 'pct', nome: 'Pacote (pct)' },
] as const;

export function qtdMinimaAtacado(p: Produto): number {
  return p.quantidadeMinimaAtacado > 0 ? p.quantidadeMinimaAtacado : 5;
}

export function ehAtacado(p: Produto, qtd: number): boolean {
  return p.precoAtacado > 0 && qtd >= qtdMinimaAtacado(p);
}

export function precoPorQtd(p: Produto, qtd: number): number {
  return ehAtacado(p, qtd) ? p.precoAtacado : p.precoVarejo;
}

export const produtoService = {
  getProdutos: async (): Promise<Produto[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar produtos', error);
      return [];
    }
  },

  getCatalogo: async (): Promise<Produto[]> => {
    try {
      const response = await axios.get(`${API_URL}/catalogo`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar catálogo', error);
      return [];
    }
  },

  getProduto: async (id: number): Promise<Produto | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto', error);
      return null;
    }
  },

  criarProduto: async (dto: Omit<Produto, 'id' | 'categoria' | 'marca' | 'estoque'>): Promise<Produto | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto', error);
      return null;
    }
  },

  atualizarProduto: async (id: number, dto: Omit<Produto, 'id' | 'categoria' | 'marca' | 'estoque'>): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto', error);
      return false;
    }
  },

  deletarProduto: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar produto', error);
      return false;
    }
  },

  getImagemUrl: (produtoId: number): string => {
    return `${API_URL}/${produtoId}/imagem`;
  },

  uploadImagem: async (produtoId: number, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_URL}/${produtoId}/imagem`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return true;
    } catch (error) {
      console.error('Erro ao upload da imagem', error);
      return false;
    }
  },

  ajustarEstoque: async (itens: { produtoId: number; quantidade: number }[]): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/estoque`, { itens });
      return true;
    } catch (error) {
      console.error('Erro ao ajustar estoque', error);
      return false;
    }
  },
};
