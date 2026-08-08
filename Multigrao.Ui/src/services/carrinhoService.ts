import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Carrinhos';

export interface CarrinhoItem {
  produtoId: number;
  quantidade: number;
}

export const carrinhoService = {
  getCarrinho: async (cpfCnpj: string): Promise<CarrinhoItem[]> => {
    try {
      const response = await axios.get(API_URL, { params: { cpfCnpj } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar carrinho salvo', error);
      return [];
    }
  },

  salvarCarrinho: async (cpfCnpj: string, itens: CarrinhoItem[]): Promise<boolean> => {
    try {
      const response = await axios.put(API_URL, { itens }, { params: { cpfCnpj } });
      return Array.isArray(response.data);
    } catch (error) {
      console.error('Erro ao salvar carrinho', error);
      return false;
    }
  },

  limparCarrinho: async (cpfCnpj: string): Promise<boolean> => {
    try {
      await axios.delete(API_URL, { params: { cpfCnpj } });
      return true;
    } catch (error) {
      console.error('Erro ao limpar carrinho', error);
      return false;
    }
  },
};
