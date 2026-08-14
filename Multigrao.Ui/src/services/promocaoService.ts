import axios from 'axios';
import type { Produto } from './produtoService';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Promocoes';

export interface PromocaoProduto {
  id: number;
  promocaoId: number;
  produtoId: number;
  precoPromocional: number | null;
  produto?: Produto | null;
}

export interface Promocao {
  id: number;
  empresaId: number;
  titulo: string;
  descricao: string | null;
  tipo: 'percentual' | 'valor';
  valor: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativa: boolean;
  produtos?: PromocaoProduto[];
}

export interface PromocaoProdutoAtiva {
  produtoId: number;
  precoPromocional: number | null;
}

export interface PromocaoAtiva {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: 'percentual' | 'valor';
  valor: number;
  dataInicio: string | null;
  dataFim: string | null;
  produtos: PromocaoProdutoAtiva[];
}

export interface PromocaoProdutoDto {
  produtoId: number;
  precoPromocional: number | null;
}

export interface CriarPromocaoDto {
  titulo: string;
  descricao?: string;
  tipo: 'percentual' | 'valor';
  valor: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativa: boolean;
  produtos: PromocaoProdutoDto[];
}

export function precoPromocional(
  preco: number,
  promo: PromocaoAtiva | undefined,
  precoPorProduto?: number | null
): number | null {
  if (!promo) return null;
  if (precoPorProduto != null) return Math.max(0, Math.min(precoPorProduto, preco));
  if (promo.tipo === 'percentual') return Math.max(0, preco * (1 - promo.valor / 100));
  return Math.max(0, preco - promo.valor);
}

export function pctDesconto(precoOriginal: number, precoPromo: number): number {
  if (precoOriginal <= 0) return 0;
  return Math.round((1 - precoPromo / precoOriginal) * 100);
}

export const promocaoService = {
  getPromocoes: async (): Promise<Promocao[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar promoções', error);
      return [];
    }
  },

  getAtivas: async (): Promise<PromocaoAtiva[]> => {
    try {
      const response = await axios.get(`${API_URL}/ativas`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar promoções ativas', error);
      return [];
    }
  },

  criarPromocao: async (dto: CriarPromocaoDto): Promise<Promocao | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar promoção', error);
      return null;
    }
  },

  atualizarPromocao: async (id: number, dto: CriarPromocaoDto): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar promoção', error);
      return false;
    }
  },

  deletarPromocao: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar promoção', error);
      return false;
    }
  },
};
