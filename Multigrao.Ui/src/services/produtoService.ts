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
  embalagem: string | null;
  unidadeVenda: string | null;
  imagemUrl: string | null;
  ativo: boolean;
  destaque: boolean;
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

  criarProduto: async (dto: Omit<Produto, 'id' | 'categoria' | 'marca'>): Promise<Produto | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto', error);
      return null;
    }
  },

  atualizarProduto: async (id: number, dto: Omit<Produto, 'id' | 'categoria' | 'marca'>): Promise<boolean> => {
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
};
