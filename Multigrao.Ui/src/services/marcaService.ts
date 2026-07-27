import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Marcas';

export interface Marca {
  id: number;
  nome: string;
  imagemUrl: string | null;
  imagemContentType: string | null;
  cor: string | null;
}

export const marcaService = {
  getMarcas: async (): Promise<Marca[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar marcas', error);
      return [];
    }
  },

  criarMarca: async (dto: Omit<Marca, 'id' | 'imagemContentType'>): Promise<Marca | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar marca', error);
      return null;
    }
  },

  atualizarMarca: async (id: number, dto: Omit<Marca, 'id' | 'imagemContentType'>): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar marca', error);
      return false;
    }
  },

  deletarMarca: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar marca', error);
      return false;
    }
  },

  uploadImagem: async (marcaId: number, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_URL}/${marcaId}/imagem`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return true;
    } catch (error) {
      console.error('Erro ao upload da imagem', error);
      return false;
    }
  },

  getImagemUrl: (marcaId: number): string => {
    return `${API_URL}/${marcaId}/imagem`;
  },
};
