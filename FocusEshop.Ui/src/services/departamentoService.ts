import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Departamentos';

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
  departamentoId: number | null;
  ativo: boolean;
}

export interface Departamento {
  id: number;
  nome: string;
  ordem: number;
  fotoUrl: string | null;
  descricao: string | null;
  ativo: boolean;
  categorias?: Categoria[];
}

export const departamentoService = {
  getDepartamentos: async (): Promise<Departamento[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar departamentos', error);
      return [];
    }
  },

  getDepartamento: async (id: number): Promise<Departamento | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar departamento', error);
      return null;
    }
  },

  getDetalhe: async (id: number): Promise<Departamento | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}/detalhe`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhe do departamento', error);
      return null;
    }
  },

  criarDepartamento: async (dto: Omit<Departamento, 'id' | 'categorias'>): Promise<Departamento | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar departamento', error);
      return null;
    }
  },

  atualizarDepartamento: async (id: number, dto: Omit<Departamento, 'id' | 'categorias'>): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar departamento', error);
      return false;
    }
  },

  deletarDepartamento: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar departamento', error);
      return false;
    }
  },

  getImagemUrl: (departamentoId: number): string => {
    return `${API_URL}/${departamentoId}/imagem`;
  },

  uploadImagem: async (departamentoId: number, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_URL}/${departamentoId}/imagem`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return true;
    } catch (error) {
      console.error('Erro ao upload da foto do departamento', error);
      return false;
    }
  },
};