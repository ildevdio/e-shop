import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Contatos';

export interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cargo: string;
  clienteId: number | null;
  clienteNome?: string;
}

export interface CriarContatoDto {
  nome: string;
  telefone: string;
  email?: string;
  cargo?: string;
  clienteId?: number | null;
}

export interface AtualizarContatoDto {
  nome?: string;
  telefone?: string;
  email?: string;
  cargo?: string;
  clienteId?: number | null;
}

export const contatoService = {
  getContatos: async (): Promise<Contato[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar contatos', error);
      return [];
    }
  },

  criarContato: async (dto: CriarContatoDto): Promise<Contato> => {
    const response = await axios.post(API_URL, dto);
    return response.data;
  },

  atualizarContato: async (id: number, dto: AtualizarContatoDto): Promise<Contato> => {
    const response = await axios.put(`${API_URL}/${id}`, dto);
    return response.data;
  },

  deletarContato: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
