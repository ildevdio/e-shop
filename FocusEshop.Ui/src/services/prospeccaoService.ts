import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Prospect';

export interface EmpresaEncontrada {
  nome: string;
  endereco: string;
  telefone: string | null;
  avaliacao: number | null;
  totalAvaliacoes: number | null;
  site: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  categoria: string | null;
  abertoAgora: boolean;
}

export interface ResultadoBusca {
  resultados: EmpresaEncontrada[];
  proximoToken: string | null;
  totalEncontrado: number;
  centro: { latitude: number; longitude: number };
}

export interface Prospect {
  id: number;
  nomeEmpresa: string;
  nomeFantasia: string;
  enderecoCompleto: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  telefone: string;
  email: string;
  site: string | null;
  categoria: string;
  placeId: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  status: string;
  observacoes: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface BuscaParams {
  enderecoOuCidade?: string;
  latitude?: number;
  longitude?: number;
  raioKm: number;
  categorias: string[];
  limite: number;
  proximoToken?: string;
}

export interface CategoriaPredefinida {
  valor: string;
  nome: string;
}

export const prospeccaoService = {
  buscar: async (params: BuscaParams): Promise<ResultadoBusca | null> => {
    try {
      const response = await axios.post(`${API_URL}/buscar`, params);
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      throw new Error(msg || 'Erro na busca de prospecção');
    }
  },

  getProspects: async (status?: string, busca?: string): Promise<Prospect[]> => {
    try {
      const params: Record<string, string> = {};
      if (status && status !== 'Todos') params.status = status;
      if (busca) params.busca = busca;
      const response = await axios.get(API_URL, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar prospects', error);
      return [];
    }
  },

  salvarProspect: async (dto: Partial<Prospect>): Promise<{ id: number } | null> => {
    try {
      const response = await axios.post(`${API_URL}/salvar`, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar prospect', error);
      return null;
    }
  },

  atualizarProspect: async (id: number, dto: { status?: string; observacoes?: string }): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar prospect', error);
      return false;
    }
  },

  deletarProspect: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar prospect', error);
      return false;
    }
  },

  getCategoriasPredefinidas: async (): Promise<CategoriaPredefinida[]> => {
    try {
      const response = await axios.get(`${API_URL}/categorias-predefinidas`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar categorias', error);
      return [];
    }
  },
};
