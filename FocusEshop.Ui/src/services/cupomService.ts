import axios from 'axios';
import type { Produto } from './produtoService';
import type { Cliente } from './clienteService';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Cupons';

export interface CupomProduto {
  id: number;
  cupomId: number;
  produtoId: number;
  produto?: Produto | null;
}

export interface CupomCliente {
  id: number;
  cupomId: number;
  clienteId: number;
  cliente?: Cliente | null;
}

export interface Cupom {
  id: number;
  empresaId: number;
  codigo: string;
  descricao: string | null;
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis';
  valor: number;
  aplicavelEm: 'pedido' | 'produtos' | 'frete';
  valorMinimoPedido: number | null;
  valorMaximoDesconto: number | null;
  usosMaximos: number | null;
  usosRealizados: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
  criadoEm: string;
  produtos?: CupomProduto[];
  clientes?: CupomCliente[];
}

export interface CriarCupomDto {
  codigo: string;
  descricao?: string;
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis';
  valor: number;
  aplicavelEm: 'pedido' | 'produtos' | 'frete';
  valorMinimoPedido?: number | null;
  valorMaximoDesconto?: number | null;
  usosMaximos?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativo: boolean;
  produtos: { produtoId: number }[];
  clientes: { clienteId: number }[];
}

export interface ResultadoAplicarCupom {
  codigo: string;
  tipo: string;
  aplicavelEm: string;
  desconto: number;
  descontoFormatado: string;
}

export const cupomService = {
  getCupons: async (): Promise<Cupom[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar cupons', error);
      return [];
    }
  },

  criarCupom: async (dto: CriarCupomDto): Promise<Cupom | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cupom', error);
      return null;
    }
  },

  atualizarCupom: async (id: number, dto: CriarCupomDto): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cupom', error);
      return false;
    }
  },

  deletarCupom: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar cupom', error);
      return false;
    }
  },

  aplicarCupom: async (dto: {
    codigo: string;
    valorPedido: number;
    valorFrete: number;
    cpfCnpj?: string;
    produtosIds?: number[];
  }): Promise<ResultadoAplicarCupom | null> => {
    try {
      const response = await axios.post(`${API_URL}/aplicar`, dto);
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao aplicar cupom';
      alert(msg);
      return null;
    }
  },
};
