import axios from 'axios';

const COM_API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Comunicacao';
const CONV_API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Conversas';
const UPLOAD_API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Upload';

export interface MensagemChat {
  id: number;
  texto: string;
  dataEnvio: string;
  dataVisualizacao: string | null;
  remetente: string;
  remetenteId: number;
  conversaId: number | null;
}

export interface CanalChat {
  id: number;
  nome: string;
}

export interface ConversaInterna {
  id: number;
  titulo: string;
  totalMensagens?: number;
  ultimaMensagem?: string;
}

export const chatService = {
  getCanais: async (): Promise<CanalChat[]> => {
    try {
      const response = await axios.get(`${COM_API_URL}/canais`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar canais', error);
      return [];
    }
  },

  getMensagens: async (conversaId?: number): Promise<MensagemChat[]> => {
    try {
      const params = conversaId != null ? { conversaId } : {};
      const response = await axios.get(`${COM_API_URL}/chat/mensagens`, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar mensagens', error);
      return [];
    }
  },

  getConversas: async (): Promise<ConversaInterna[]> => {
    try {
      const response = await axios.get(`${COM_API_URL}/chat/conversas`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar conversas', error);
      return [];
    }
  },

  getOuCriarConversaCanal: async (setorId: number): Promise<ConversaInterna | null> => {
    try {
      const response = await axios.get(`${COM_API_URL}/chat/conversa/canal/${setorId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter conversa do canal', error);
      return null;
    }
  },

  getOuCriarConversaDireta: async (usuario1Id: number, usuario2Id: number): Promise<ConversaInterna | null> => {
    try {
      const response = await axios.get(`${COM_API_URL}/chat/conversa/direto`, {
        params: { usuario1Id, usuario2Id }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter conversa direta', error);
      return null;
    }
  },

  uploadArquivo: async (file: File): Promise<{ url: string; nomeOriginal: string; tamanho: number } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${UPLOAD_API_URL}/arquivo`, formData);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar arquivo', error);
      return null;
    }
  },

  enviarMensagemArquivo: async (conversaId: number, usuarioRemetenteId: number, texto: string, urlAnexo: string): Promise<boolean> => {
    try {
      await axios.post(`${CONV_API_URL}/${conversaId}/mensagens`, {
        usuarioRemetenteId,
        texto,
        urlAnexo,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem com anexo', error);
      return false;
    }
  },

  marcarVisualizadas: async (conversaId: number, usuarioId: number): Promise<boolean> => {
    try {
      await axios.post(`${CONV_API_URL}/${conversaId}/visualizar`, { usuarioId });
      return true;
    } catch (error) {
      console.error('Erro ao marcar mensagens como visualizadas', error);
      return false;
    }
  },

  enviarMensagemHttp: async (conversaId: number, usuarioRemetenteId: number, texto: string): Promise<boolean> => {
    try {
      await axios.post(`${CONV_API_URL}/${conversaId}/mensagens`, {
        usuarioRemetenteId,
        texto,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem', error);
      return false;
    }
  },
};
