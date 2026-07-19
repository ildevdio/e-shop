import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Conferencia';

export interface EntregaConferencia {
  id: number;
  rotaId: number;
  pedidoId: number;
  ordem: number;
  status: string;
  observacao: string | null;
  pedido?: {
    id: number;
    valorTotal: number;
    cliente?: { id: number; razaoSocialNome: string };
    itens?: { id: number; quantidade: number; produto?: { nome: string }; separado: boolean }[];
  };
  rota?: {
    id: number;
    motorista?: { id: number; nome: string };
  };
}

export const conferenciaService = {
  getEntregasPendentes: async (): Promise<EntregaConferencia[]> => {
    try {
      const response = await axios.get(`${API_URL}/pendentes`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar entregas para conferência', error);
      return [];
    }
  },

  iniciarConferencia: async (entregaId: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${entregaId}/iniciar`);
      return true;
    } catch (error) {
      console.error('Erro ao iniciar conferência', error);
      return false;
    }
  },

  concluirConferencia: async (entregaId: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${entregaId}/concluir`);
      return true;
    } catch (error) {
      console.error('Erro ao concluir conferência', error);
      return false;
    }
  },
};
