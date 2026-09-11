import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Avisos';

export interface Aviso {
  id: number;
  titulo: string;
  conteudo: string;
  dataPublicacao: string;
  tipo: string;
  setorAlvo: string | null;
  autorNome: string;
}

export interface CriarAvisoDto {
  titulo: string;
  conteudo: string;
  autorId: number;
  setorAlvoId?: number | null;
}

export const avisoService = {
  getAvisos: async (setorId?: number): Promise<Aviso[]> => {
    try {
      const params = setorId ? { setorId } : {};
      const response = await axios.get(API_URL, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar avisos', error);
      return [];
    }
  },

  criarAviso: async (dto: CriarAvisoDto): Promise<Aviso | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar aviso', error);
      return null;
    }
  },

  excluirAviso: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir aviso', error);
      return false;
    }
  },
};
