import axios from 'axios';
import { type Pedido } from './pedidoService';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Pedidos';

export type { Pedido };

export const conferenciaService = {
  getPedidosEmConferencia: async (): Promise<Pedido[]> => {
    try {
      const response = await axios.get(`${API_URL}/em-conferencia`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar pedidos para conferência', error);
      return [];
    }
  },

  concluirConferencia: async (pedidoId: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${pedidoId}/concluir-conferencia`);
      return true;
    } catch (error) {
      console.error('Erro ao concluir conferência', error);
      return false;
    }
  },
};
