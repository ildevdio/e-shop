import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Enquete';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface OpcaoEnquete {
  id: number;
  texto: string;
  ordem: number;
  votos: number;
}

export interface Enquete {
  id: number;
  titulo: string;
  dataCriacao: string;
  dataExpiracao: string;
  ativa: boolean;
  autorNome: string;
  totalVotos: number;
  opcoes: OpcaoEnquete[];
}

export interface CriarEnqueteDto {
  titulo: string;
  autorId: number;
  opcoes: string[];
}

export const enqueteService = {
  getEnquetes: async (): Promise<Enquete[]> => {
    try {
      const response = await axios.get(API_URL, { headers: authHeaders() });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar enquetes', error);
      return [];
    }
  },

  criarEnquete: async (dto: CriarEnqueteDto): Promise<boolean> => {
    try {
      await axios.post(API_URL, dto, { headers: authHeaders() });
      return true;
    } catch (error) {
      console.error('Erro ao criar enquete', error);
      return false;
    }
  },

  votar: async (enqueteId: number, opcaoId: number, usuarioId: number): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/${enqueteId}/votar`, { opcaoEnqueteId: opcaoId, usuarioId }, { headers: authHeaders() });
      return true;
    } catch (error) {
      console.error('Erro ao votar', error);
      return false;
    }
  },

  encerrar: async (enqueteId: number): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${enqueteId}/encerrar`, null, { headers: authHeaders() });
      return true;
    } catch (error) {
      console.error('Erro ao encerrar enquete', error);
      return false;
    }
  },

  excluir: async (enqueteId: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${enqueteId}`, { headers: authHeaders() });
      return true;
    } catch (error) {
      console.error('Erro ao excluir enquete', error);
      return false;
    }
  },
};
