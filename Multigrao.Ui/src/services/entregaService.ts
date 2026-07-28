import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Motorista';

export interface Entrega {
  id: number;
  rotaId: number;
  ordem: number;
  status: string;
  observacao: string | null;
  motivoDevolucao: string | null;
  rota?: {
    id: number;
    motoristaId: number;
    motorista?: { id: number; nome: string };
    veiculo?: { id: number; modelo: string; placa: string };
    linkGoogleMaps?: string | null;
  };
  entregaPedidos?: {
    pedidoId: number;
    pedido?: {
      id: number;
      valorTotal: number;
      pesoTotal: number;
      pagamento?: string;
      liberadoFinanceiro?: boolean;
      cliente?: { id: number; razaoSocialNome: string; bairro: string; logradouro: string; numero: string; telefone: string; };
      itens?: { id: number; quantidade: number; produto?: { nome: string } }[];
    };
  }[];
}

export interface RegistroEntregaDto {
  acao: 'Entregue' | 'Devolvido' | 'EmRota';
  motivoDevolucao?: string;
  observacao?: string;
}

export const entregaService = {
  getEntregas: async (motoristaId?: number): Promise<Entrega[]> => {
    try {
      const params = motoristaId ? { motoristaId } : {};
      const response = await axios.get(`${API_URL}/entregas`, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar entregas', error);
      return [];
    }
  },

  getMinhasEntregas: async (motoristaId: number): Promise<Entrega[]> => {
    try {
      const response = await axios.get(`${API_URL}/minhas-entregas`, { params: { motoristaId } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar minhas entregas', error);
      return [];
    }
  },

  temEntregasPendentes: async (motoristaId: number): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/minhas-entregas`, { params: { motoristaId } });
      const rotas = Array.isArray(response.data) ? response.data : [];
      return rotas.some((r: any) =>
        r.entregas?.some((e: any) => e.status === 'PendenteConferencia' || e.status === 'EmConferencia' || e.status === 'EmRota')
      );
    } catch {
      return false;
    }
  },

  registrarAcao: async (entregaId: number, dto: RegistroEntregaDto): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/entrega/${entregaId}/registrar`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao registrar ação da entrega', error);
      return false;
    }
  },
};
