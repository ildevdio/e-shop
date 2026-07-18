import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Clientes';

export interface ContatoResumo {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cargo: string;
}

export interface Cliente {
  id: number;
  razaoSocialNome: string;
  nomeFantasia: string;
  cpfCnpj: string;
  tipoPessoa: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  regimeTributario: string;
  contatos?: ContatoResumo[];
}

export interface CriarClienteDto {
  razaoSocialNome: string;
  nomeFantasia?: string;
  cpfCnpj: string;
  tipoPessoa?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  regimeTributario?: string;
}

export const clienteService = {
  getClientes: async (): Promise<Cliente[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar clientes', error);
      return [];
    }
  },

  criarCliente: async (dto: CriarClienteDto): Promise<Cliente> => {
    const response = await axios.post(API_URL, dto);
    return response.data;
  },

  atualizarCliente: async (id: number, dto: CriarClienteDto): Promise<Cliente> => {
    const response = await axios.put(`${API_URL}/${id}`, dto);
    return response.data;
  },

  deletarCliente: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
