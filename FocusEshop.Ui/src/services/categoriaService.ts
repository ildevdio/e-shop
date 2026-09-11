import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Categorias';

export interface Departamento {
  id: number;
  nome: string;
  ordem: number;
}

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
  departamentoId: number | null;
  ativo: boolean;
  departamento?: Departamento | null;
}

export const categoriaService = {
  getCategorias: async (departamentoId?: number): Promise<Categoria[]> => {
    try {
      const params = departamentoId != null ? { departamentoId } : undefined;
      const response = await axios.get(API_URL, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar categorias', error);
      return [];
    }
  },

  getCategoria: async (id: number): Promise<Categoria | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categoria', error);
      return null;
    }
  },

  getDetalhe: async (id: number): Promise<Categoria | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}/detalhe`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhe da categoria', error);
      return null;
    }
  },

  criarCategoria: async (dto: Omit<Categoria, 'id'>): Promise<Categoria | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar categoria', error);
      return null;
    }
  },

  atualizarCategoria: async (id: number, dto: Omit<Categoria, 'id'>): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar categoria', error);
      return false;
    }
  },

  deletarCategoria: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar categoria', error);
      return false;
    }
  },
};