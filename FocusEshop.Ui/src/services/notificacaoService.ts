import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Notificacoes';

export interface Notificacao {
  id: number;
  usuarioDestinoId: number | null;
  setorAlvo: string | null;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'pedido' | 'aviso' | 'sistema';
  link: string | null;
  lida: boolean;
  criadaEm: string;
}

export const notificacaoService = {
  listar: async (params?: { usuarioId?: number; setor?: string; lidas?: boolean }): Promise<Notificacao[]> => {
    try {
      const response = await axios.get(API_URL, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  contarNaoLidas: async (params?: { usuarioId?: number; setor?: string }): Promise<number> => {
    try {
      const response = await axios.get(`${API_URL}/count`, { params });
      return response.data.count ?? 0;
    } catch {
      return 0;
    }
  },

  marcarLida: async (id: number): Promise<void> => {
    try {
      await axios.put(`${API_URL}/${id}/lida`);
    } catch { /* ignora */ }
  },

  marcarTodasLidas: async (params?: { usuarioId?: number; setor?: string }): Promise<void> => {
    try {
      await axios.put(`${API_URL}/lidas-todas`, null, { params });
    } catch { /* ignora */ }
  },

  criar: async (notificacao: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>): Promise<Notificacao | null> => {
    try {
      const response = await axios.post(API_URL, notificacao);
      return response.data;
    } catch {
      return null;
    }
  },
};
