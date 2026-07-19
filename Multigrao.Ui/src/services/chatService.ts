import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Comunicacao';

export interface MensagemChat {
  id: number;
  texto: string;
  dataEnvio: string;
  remetente: string;
  remetenteId: number;
  conversaId: number | null;
}

export interface CanalChat {
  id: number;
  nome: string;
}

export const chatService = {
  getCanais: async (): Promise<CanalChat[]> => {
    try {
      const response = await axios.get(`${API_URL}/canais`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar canais', error);
      return [];
    }
  },

  getMensagens: async (conversaId?: number): Promise<MensagemChat[]> => {
    try {
      const params = conversaId != null ? { conversaId } : {};
      const response = await axios.get(`${API_URL}/chat/mensagens`, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar mensagens', error);
      return [];
    }
  },
};
