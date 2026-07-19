import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Logistica';

export interface Veiculo {
  id: number;
  modelo: string;
  placa: string;
  pesoMaximo: number;
}

export interface Motorista {
  id: number;
  nome: string;
}

export interface EntregaRota {
  id: number;
  rotaId: number;
  pedidoId: number;
  ordem: number;
  status: string;
  observacao: string | null;
  motivoDevolucao: string | null;
  pedido?: {
    id: number;
    cliente?: { id: number; razaoSocialNome: string; bairro: string; logradouro: string; numero: string; telefone: string; };
    valorTotal: number;
    pesoTotal: number;
    itens?: { id: number; quantidade: number; produto?: { nome: string } }[];
  };
}

export interface Rota {
  id: number;
  data: string;
  veiculoId: number;
  motoristaId: number;
  status: string;
  linkGoogleMaps: string | null;
  veiculo?: Veiculo;
  motorista?: { id: number; nome: string };
  entregas: EntregaRota[];
}

export interface CriarVeiculoDto {
  modelo: string;
  placa: string;
  pesoMaximo: number;
}

export interface GerarRotaDto {
  veiculoId: number;
  motoristaId: number;
  pedidosIds: number[];
}

export interface PedidoPronto {
  id: number;
  clienteId: number;
  cliente?: { id: number; razaoSocialNome: string; bairro: string; logradouro: string; numero: string; telefone: string; };
  status: string;
  pesoTotal: number;
  valorTotal: number;
  dataCriacao: string;
  itens?: { id: number; quantidade: number; produto?: { nome: string } }[];
}

export const logisticaService = {
  getVeiculos: async (): Promise<Veiculo[]> => {
    try {
      const response = await axios.get(`${API_URL}/veiculos`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar veículos', error);
      return [];
    }
  },

  getMotoristas: async (): Promise<Motorista[]> => {
    try {
      const response = await axios.get(`${API_URL}/motoristas`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar motoristas', error);
      return [];
    }
  },

  getPedidosProntos: async (): Promise<PedidoPronto[]> => {
    try {
      const response = await axios.get(`${API_URL}/pedidos-prontos`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar pedidos prontos', error);
      return [];
    }
  },

  criarVeiculo: async (dto: CriarVeiculoDto): Promise<Veiculo | null> => {
    try {
      const response = await axios.post(`${API_URL}/veiculos`, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar veículo', error);
      return null;
    }
  },

  excluirVeiculo: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/veiculos/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir veículo', error);
      return false;
    }
  },

  getRotas: async (): Promise<Rota[]> => {
    try {
      const response = await axios.get(`${API_URL}/rotas`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar rotas', error);
      return [];
    }
  },

  gerarRota: async (dto: GerarRotaDto): Promise<{ rotaId: number } | null> => {
    try {
      const response = await axios.post(`${API_URL}/rotas/gerar`, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar rota', error);
      return null;
    }
  },
};
