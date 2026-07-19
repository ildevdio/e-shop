import axios from 'axios';

// Usar API local na porta 5000 (ou a porta onde a API do Multigrao estiver rodando)
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/atendimento';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date | string;
  type?: 'text' | 'image' | 'file' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  edited?: boolean;
}

export interface Lead {
  nome: string;
  telefone: string;
  interesse: string;
  origem: string;
  bairro?: string;
  quantidade?: string;
  embalagem?: string;
  pagamento?: string;
  tipoCliente?: string;
  vendaFechada?: boolean;
  resumoIA?: string;
}

export interface ChatSession {
  id: string;
  lead: Lead;
  messages: Message[];
  iaActive: boolean;
}

export interface Contato {
  id: number;
  nome: string;
  telefone: string;
  clienteId: number | null;
  clienteNome?: string;
}

export const atendimentoService = {
  getContatos: async (): Promise<Contato[]> => {
    try {
      const response = await axios.get(`${API_URL}/contatos`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Erro ao buscar contatos", error);
      return [];
    }
  },

  getAtendimentos: async (): Promise<ChatSession[]> => {
    try {
      const response = await axios.get(API_URL);
      const data = Array.isArray(response.data) ? response.data : [];
      return data.map((a: any) => ({
        id: a.id,
        lead: {
          nome: a.lead?.nome || a.nome || 'Lead',
          telefone: a.lead?.telefone || a.telefone || '',
          interesse: a.lead?.interesse || a.interesse || '',
          origem: a.lead?.origem || a.origem || '',
          bairro: a.lead?.bairro || a.bairro,
          quantidade: a.lead?.quantidade || a.quantidade,
          embalagem: a.lead?.embalagem || a.embalagem,
          pagamento: a.lead?.pagamento || a.pagamento,
          tipoCliente: a.lead?.tipoCliente || a.tipoCliente,
          vendaFechada: a.lead?.vendaFechada ?? a.vendaFechada ?? false,
          resumoIA: a.lead?.resumoIA || a.resumoIA,
        },
        messages: (a.messages || []).map((m: any) => ({
          id: String(m.id),
          text: m.text,
          sender: m.sender || 'bot',
          timestamp: m.timestamp || new Date().toISOString(),
        })),
        iaActive: a.iaActive ?? true,
      }));
    } catch (error) {
      console.error("Erro ao buscar atendimentos", error);
      throw error;
    }
  },

  enviarMensagem: async (atendimentoId: string, text: string, sender: 'user' | 'bot' | 'agent'): Promise<Message> => {
    const response = await axios.post(`${API_URL}/${atendimentoId}/mensagens`, { text, sender });
    return response.data;
  },

  atualizarLead: async (atendimentoId: string, lead: Partial<Lead> & { iaActive?: boolean }) => {
    const response = await axios.put(`${API_URL}/${atendimentoId}`, lead);
    return response.data;
  },

  gerarResumoIa: async (atendimentoId: string): Promise<{ resumoIA: string }> => {
    const response = await axios.post(`${API_URL}/${atendimentoId}/ia-resumo`);
    return response.data;
  },

  finalizarAtendimento: async (atendimentoId: string) => {
    const response = await axios.post(`${API_URL}/${atendimentoId}/finalizar`);
    return response.data;
  },

  getUsuarios: async (): Promise<{ id: number; nome: string; setores: string[] }[]> => {
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Usuarios');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Erro ao buscar usuários", error);
      return [];
    }
  },

  criarAtendimento: async (nome: string, telefone?: string, interesse?: string): Promise<ChatSession> => {
    const response = await axios.post(API_URL, { nome, telefone, interesse, origem: 'Manual' });
    const a = response.data;
    return {
      id: a.id,
      lead: {
        nome: a.lead?.nome || nome,
        telefone: a.lead?.telefone || telefone || '',
        interesse: a.lead?.interesse || interesse || '',
        origem: a.lead?.origem || 'Manual',
        vendaFechada: a.lead?.vendaFechada ?? false,
        resumoIA: a.lead?.resumoIA,
      },
      messages: (a.messages || []).map((m: any) => ({
        id: String(m.id),
        text: m.text,
        sender: m.sender || 'bot',
        timestamp: m.timestamp || new Date().toISOString(),
      })),
      iaActive: a.iaActive ?? true,
    };
  }
};
