import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Pedidos';

export interface Produto {
  id: number;
  nome: string;
  pesoUnidade: number;
  codigoERP: string;
}

export interface ItemPedido {
  id: number;
  pedidoId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  pesoUnitario: number;
  separado: boolean;
  separadoPorUsuarioId: number | null;
  status: string;
  produto?: Produto;
  separadoPorUsuario?: { id: number; nome: string } | null;
}

export interface Pedido {
  id: number;
  clienteId: number | null;
  cliente?: { id: number; razaoSocialNome: string; cpfCnpj: string; bairro: string; logradouro: string; numero: string; telefone: string; };
  solicitanteNome?: string;
  solicitanteTelefone?: string;
  cpfCnpj?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  enderecoConfere?: boolean;
  status: string;
  tipoEntrega: string;
  desconto: number;
  acrescimo: number;
  valorFinal: number;
  pesoTotal: number;
  valorTotal: number;
  dataCriacao: string;
  itens: ItemPedido[];
}

export interface CriarPedidoDto {
  clienteId: number;
  valorTotal: number;
  pesoTotal: number;
  observacao?: string;
  tipoEntrega: string;
  desconto: number;
  acrescimo: number;
  itens: { produtoId: number; quantidade: number; precoUnitario: number; pesoUnitario: number }[];
}

export interface SolicitacaoCatalogoDto {
  solicitanteNome: string;
  solicitanteTelefone: string;
  cpfCnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  valorTotal: number;
  tipoEntrega: string;
  desconto: number;
  acrescimo: number;
  itens: { produtoId: number; quantidade: number; precoUnitario: number; pesoUnitario: number }[];
}

export const pedidoService = {
  getPedidos: async (): Promise<Pedido[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar pedidos', error);
      return [];
    }
  },

  getPedido: async (id: number): Promise<Pedido | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedido', error);
      return null;
    }
  },

  criarPedido: async (dto: CriarPedidoDto): Promise<Pedido | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pedido', error);
      return null;
    }
  },

  solicitarCatalogo: async (dto: SolicitacaoCatalogoDto): Promise<Pedido | null> => {
    try {
      const response = await axios.post(`${API_URL}/solicitacao-catalogo`, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar pedido do catálogo', error);
      return null;
    }
  },

  iniciarSeparacao: async (id: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}/separar`);
      return true;
    } catch (error) {
      console.error('Erro ao iniciar separação', error);
      return false;
    }
  },

  concluirSeparacao: async (id: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}/concluir-separacao`);
      return true;
    } catch (error) {
      console.error('Erro ao concluir separação', error);
      return false;
    }
  },

  concluirConferencia: async (id: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}/concluir-conferencia`);
      return true;
    } catch (error) {
      console.error('Erro ao concluir conferência', error);
      return false;
    }
  },

  atualizarPedido: async (id: number, dto: {
    tipoEntrega?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    desconto?: number;
    acrescimo?: number;
    valorTotal?: number;
    itens?: { id: number; quantidade?: number; precoUnitario?: number }[];
  }): Promise<Pedido | null> => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar pedido', error);
      return null;
    }
  },

  confirmarPedido: async (id: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}/confirmar-pedido`);
      return true;
    } catch (error) {
      console.error('Erro ao confirmar pedido', error);
      return false;
    }
  },

  confirmarRetirada: async (id: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}/confirmar-retirada`);
      return true;
    } catch (error) {
      console.error('Erro ao confirmar retirada', error);
      return false;
    }
  },

  separarItem: async (pedidoId: number, itemId: number, usuarioId: number): Promise<{ separado: boolean } | null> => {
    try {
      const response = await axios.put(`${API_URL}/${pedidoId}/itens/${itemId}/separar`, { usuarioId });
      return response.data;
    } catch (error) {
      console.error('Erro ao separar item', error);
      return null;
    }
  },
};
