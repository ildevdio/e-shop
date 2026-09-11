import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/SubCategorias';

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
}

export interface SubCategoria {
  id: number;
  nome: string;
  ordem: number;
  categoriaId: number | null;
  ativo: boolean;
  categoria?: Categoria | null;
}

export const subCategoriaService = {
  getSubCategorias: async (categoriaId?: number): Promise<SubCategoria[]> => {
    try {
      const params = categoriaId != null ? { categoriaId } : undefined;
      const response = await axios.get(API_URL, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar subcategorias', error);
      return [];
    }
  },

  getSubCategoriasComCategoria: async (): Promise<SubCategoria[]> => {
    try {
      const response = await axios.get(`${API_URL}/categoria/lista`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar subcategorias', error);
      return [];
    }
  },

  getSubCategoria: async (id: number): Promise<SubCategoria | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar subcategoria', error);
      return null;
    }
  },

  criarSubCategoria: async (dto: Omit<SubCategoria, 'id' | 'categoria'>): Promise<SubCategoria | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar subcategoria', error);
      return null;
    }
  },

  atualizarSubCategoria: async (id: number, dto: Omit<SubCategoria, 'id' | 'categoria'>): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar subcategoria', error);
      return false;
    }
  },

  deletarSubCategoria: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar subcategoria', error);
      return false;
    }
  },
};