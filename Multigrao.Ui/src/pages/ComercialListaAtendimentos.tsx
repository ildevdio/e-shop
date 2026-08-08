import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Eye, CheckCircle, Bot, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';

interface Atendimento {
  id: string;
  lead: {
    nome: string;
    telefone: string;
    interesse: string;
    origem: string;
    bairro: string;
    quantidade: string;
    embalagem: string;
    pagamento: string;
    tipoCliente: string;
    resumoIA: string;
    vendaFechada: boolean;
  };
  iaActive: boolean;
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: string;
  }> | null;
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

export default function ComercialListaAtendimentos() {
  const { setModalAberto } = useUiStore();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<Atendimento | null>(null);

  useEffect(() => {
    carregarAtendimentos();
  }, []);

  const carregarAtendimentos = async () => {
    try {
      const res = await fetch(`${API_URL}/Atendimento`);
      if (!res.ok) return;
      setAtendimentos(await res.json());
    } catch {
      setAtendimentos([]);
    }
  };

  const filtrados = atendimentos.filter(a =>
    a.lead.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.lead.telefone.includes(busca) ||
    a.lead.interesse.toLowerCase().includes(busca.toLowerCase()) ||
    a.lead.bairro.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/comercial" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Lista de Atendimentos</h1>
          <p className="text-gray-500 mt-1">Histórico de todos os atendimentos realizados.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, interesse ou bairro..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Nome</th>
                <th className="px-6 py-3 font-semibold">Telefone</th>
                <th className="px-6 py-3 font-semibold">Interesse</th>
                <th className="px-6 py-3 font-semibold">Bairro</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Atendente</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Nenhum atendimento encontrado.
                  </td>
                </tr>
              ) : filtrados.map(a => (
                <tr key={a.id} onDoubleClick={() => { setDetalhe(a); setModalAberto(true); }} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.lead.nome}</td>
                  <td className="px-6 py-4">{a.lead.telefone}</td>
                  <td className="px-6 py-4">{a.lead.interesse || '—'}</td>
                  <td className="px-6 py-4">{a.lead.bairro || '—'}</td>
                  <td className="px-6 py-4">{a.lead.tipoCliente || '—'}</td>
                  <td className="px-6 py-4">
                    {a.lead.vendaFechada ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-black ring-1 ring-black/20">
                        <CheckCircle size={12} /> Fechado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 ring-1 ring-gray-300">
                        Aberto
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {a.iaActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-black ring-1 ring-black/20">
                        <Bot size={12} /> Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                        <User size={12} /> Humano
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setDetalhe(a); setModalAberto(true); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalhe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Detalhes do Atendimento</h2>
              <button onClick={() => { setDetalhe(null); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <span className="text-gray-500">✕</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Nome</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.nome}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Telefone</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.telefone}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Interesse</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.interesse || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Bairro</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.bairro || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Quantidade</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.quantidade || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Embalagem</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.embalagem || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Pagamento</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.pagamento || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Origem</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.lead.origem || '—'}</p>
                </div>
              </div>
              {detalhe.lead.resumoIA && (
                <div className="bg-gray-100 rounded-xl p-4 mt-3">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Resumo IA</span>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{detalhe.lead.resumoIA}</p>
                </div>
              )}
              {detalhe.messages && detalhe.messages.length > 0 && (
                <div className="mt-4">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Mensagens</span>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {detalhe.messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[80%] ${
                          m.sender === 'user' ? 'bg-gray-100 text-gray-700' : 'bg-black text-white'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
