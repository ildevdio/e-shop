import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Relatorios';

export interface VendasPeriodo {
  agrupamento: string;
  totalPedidos: number;
  valorTotalGeral: number;
  ticketMedioGeral: number;
  dados: {
    periodo: string;
    totalPedidos: number;
    valorTotal: number;
    valorFinal: number;
    ticketMedio: number;
  }[];
}

export interface TopProduto {
  produtoId: number;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
  numPedidos: number;
  percentual: number;
}

export interface ClienteTop {
  clienteId: number;
  clienteNome: string;
  cpfCnpj: string;
  totalPedidos: number;
  valorTotal: number;
  ticketMedio: number;
  ultimoPedido: string;
}

export interface DesempenhoVendedor {
  vendedorId: number;
  vendedorNome: string;
  totalPedidos: number;
  valorTotal: number;
  ticketMedio: number;
  numClientes: number;
}

export interface EstoqueMargem {
  produtoId: number;
  produtoNome: string;
  categoria: string;
  marca: string;
  estoqueAtual: number;
  quantidadeVendida: number;
  receitaTotal: number;
  precoVarejo: number;
  giroEstoque: number;
}

export const relatorioService = {
  getVendasPeriodo: async (params: { dataInicio?: string; dataFim?: string; agrupamento?: string }): Promise<VendasPeriodo | null> => {
    try {
      const response = await axios.get(`${API_URL}/vendas-periodo`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar vendas por período', error);
      return null;
    }
  },

  getTopProdutos: async (params: { dataInicio?: string; dataFim?: string; limite?: number }): Promise<TopProduto[]> => {
    try {
      const response = await axios.get(`${API_URL}/top-produtos`, { params });
      return response.data?.dados ?? [];
    } catch (error) {
      console.error('Erro ao buscar top produtos', error);
      return [];
    }
  },

  getClientesTop: async (params: { dataInicio?: string; dataFim?: string; limite?: number }): Promise<ClienteTop[]> => {
    try {
      const response = await axios.get(`${API_URL}/clientes-top`, { params });
      return response.data?.dados ?? [];
    } catch (error) {
      console.error('Erro ao buscar clientes top', error);
      return [];
    }
  },

  getDesempenhoVendedor: async (params: { dataInicio?: string; dataFim?: string }): Promise<DesempenhoVendedor[]> => {
    try {
      const response = await axios.get(`${API_URL}/desempenho-vendedor`, { params });
      return response.data?.dados ?? [];
    } catch (error) {
      console.error('Erro ao buscar desempenho vendedor', error);
      return [];
    }
  },

  getEstoqueMargem: async (params: { dataInicio?: string; dataFim?: string; limite?: number }): Promise<EstoqueMargem[]> => {
    try {
      const response = await axios.get(`${API_URL}/estoque-margem`, { params });
      return response.data?.dados ?? [];
    } catch (error) {
      console.error('Erro ao buscar estoque e margem', error);
      return [];
    }
  },
};
