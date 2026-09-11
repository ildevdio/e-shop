import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/bots';

export interface BotConfig {
  id: number;
  nome: string;
  tipoTrigger: string;
  valorTrigger: string;
  tipoReacao: string;
  textoResposta: string;
  acaoBot: string;
  campoLead?: string | null;
  ordem: number;
  ativo: boolean;
}

export interface BotConfigInput {
  nome: string;
  tipoTrigger: string;
  valorTrigger: string;
  tipoReacao: string;
  textoResposta: string;
  acaoBot: string;
  campoLead?: string | null;
  ordem: number;
  ativo: boolean;
}

export const TRIGGER_OPCOES = [
  { valor: 'Saudacao', label: 'Saudação' },
  { valor: 'Menu', label: 'Menu / Ajuda' },
  { valor: 'PalavraChave', label: 'Palavra-chave (contém)' },
  { valor: 'Igual', label: 'Igual (exato)' },
  { valor: 'Regex', label: 'Expressão regular' },
  { valor: 'Qualquer', label: 'Qualquer mensagem' },
];

export const REACAO_OPCOES = [
  { valor: 'Texto', label: 'Texto fixo' },
  { valor: 'PrecoProduto', label: 'Preço de produto' },
  { valor: 'EstoqueProduto', label: 'Estoque de produto' },
  { valor: 'StatusPedido', label: 'Status do pedido' },
  { valor: 'Menu', label: 'Menu de opções' },
];

export const ACAO_OPCOES = [
  { valor: 'Responder', label: 'Responder' },
  { valor: 'ResponderEDesativarIA', label: 'Responder e entregar ao humano' },
  { valor: 'SalvarLead', label: 'Salvar dado no lead (ficha)' },
];

export const CAMPOS_LEAD = [
  { valor: 'Bairro', label: 'Bairro de entrega' },
  { valor: 'Interesse', label: 'Produtos de interesse' },
  { valor: 'Quantidade', label: 'Quantidade' },
  { valor: 'Embalagem', label: 'Embalagem' },
  { valor: 'Pagamento', label: 'Pagamento' },
  { valor: 'TipoCliente', label: 'Tipo de cliente' },
];

export const botsService = {
  listar: async (): Promise<BotConfig[]> => {
    try {
      const { data } = await axios.get(API_URL);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  criar: async (input: BotConfigInput) => {
    const { data } = await axios.post(API_URL, input);
    return data;
  },
  atualizar: async (id: number, input: BotConfigInput) => {
    const { data } = await axios.put(`${API_URL}/${id}`, input);
    return data;
  },
  excluir: async (id: number) => {
    const { data } = await axios.delete(`${API_URL}/${id}`);
    return data;
  },
};
