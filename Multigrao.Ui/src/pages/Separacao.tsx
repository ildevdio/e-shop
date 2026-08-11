import { useState, useEffect } from 'react';
import { PackageOpen, Check, Play, QrCode, MapPin, Search, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pedidoService, type Pedido } from '../services/pedidoService';

interface ItemPedidoLocal {
  id: number;
  nome: string;
  quantidade: number;
  unidade: string;
  localizacao: string;
  separado: boolean;
  separadoPor?: string;
}

interface PedidoLocal {
  id: number;
  cliente: string;
  status: 'Pendente' | 'EmSeparacao' | 'EmConferencia';
  itens: ItemPedidoLocal[];
  assumidoPor?: string;
}

function mapearPedido(p: Pedido): PedidoLocal {
  return {
    id: p.id,
    cliente: p.cliente?.razaoSocialNome ?? 'Cliente #' + p.clienteId,
    status: p.status === 'EmSeparacao' ? 'EmSeparacao' : p.status === 'EmConferencia' ? 'EmConferencia' : 'Pendente',
    itens: (p.itens ?? []).map((it, idx) => ({
      id: it.id,
      nome: it.produto?.nome ?? `Item #${it.produtoId}`,
      quantidade: it.quantidade,
      unidade: 'kg',
      localizacao: `Prateleira ${String.fromCharCode(65 + (idx % 4))}${(idx % 6) + 1}`,
      separado: it.separado,
      separadoPor: it.separadoPorUsuario?.nome,
    })),
    assumidoPor: p.itens?.find(it => it.separadoPorUsuario)?.separadoPorUsuario?.nome,
  };
}

type Step = 'fila' | 'separacao' | 'concluido';

export default function Separacao() {
  const usuarioId = useAuthStore(state => state.usuarioId);
  const nome = useAuthStore(state => state.nome);
  const [pedidos, setPedidos] = useState<PedidoLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [step, setStep] = useState<Step>('fila');
  const [pedidoAtivo, setPedidoAtivo] = useState<PedidoLocal | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const dados = await pedidoService.getPedidos();
    const relevantes = dados.filter(p => p.status === 'Pendente' || p.status === 'EmSeparacao' || p.status === 'EmConferencia');
    setPedidos(relevantes.map(mapearPedido));
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = pedidos.filter(p => {
    if (!filtro) return true;
    const termo = filtro.toLowerCase();
    return String(p.id).includes(termo) || p.cliente.toLowerCase().includes(termo);
  });

  const pendentes = filtrados.filter(p => p.status === 'Pendente');
  const emSeparacao = filtrados.filter(p => p.status === 'EmSeparacao');
  const emConferencia = filtrados.filter(p => p.status === 'EmConferencia');

  const assumirPedido = async (pedido: PedidoLocal) => {
    const ok = await pedidoService.iniciarSeparacao(pedido.id);
    if (ok) {
      await carregar();
      setPedidoAtivo({ ...pedido, status: 'EmSeparacao' });
      setStep('separacao');
    }
  };

  const retomarPedido = (pedido: PedidoLocal) => {
    setPedidoAtivo(pedido);
    setStep('separacao');
  };

  const toggleItem = async (itemId: number) => {
    if (usuarioId == null || !pedidoAtivo) return;
    const resultado = await pedidoService.separarItem(pedidoAtivo.id, itemId, usuarioId);
    if (!resultado) { alert('Erro ao separar item.'); return; }
    const atualizado = await pedidoService.getPedido(pedidoAtivo.id);
    if (atualizado) {
      const mapped = mapearPedido(atualizado);
      setPedidoAtivo(mapped);
      setPedidos(prev => prev.map(p => p.id === mapped.id ? mapped : p));
    }
  };

  const concluirSeparacao = async () => {
    if (!pedidoAtivo) return;
    const ok = await pedidoService.concluirSeparacao(pedidoAtivo.id);
    if (ok) {
      await carregar();
      setStep('concluido');
    }
  };

  const voltarParaFila = () => {
    setPedidoAtivo(null);
    setStep('fila');
  };

  const totalItens = pedidoAtivo?.itens.length ?? 0;
  const itensSeparados = pedidoAtivo?.itens.filter(i => i.separado).length ?? 0;
  const progresso = totalItens > 0 ? (itensSeparados / totalItens) * 100 : 0;
  const todosSeparados = totalItens > 0 && itensSeparados === totalItens;

  return (
    <div className="space-y-6 h-full flex flex-col">

      {/* PASSO 1 — FILA */}
      {step === 'fila' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Passo 1 de 3</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <PackageOpen size={28} /> Fila de Separação
              </h1>
              <p className="text-gray-500 mt-1">Escolha um pedido para iniciar a separação dos itens.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar pedido..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
              />
            </div>
          </div>

          {carregando ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Carregando pedidos...</div>
          ) : pendentes.length === 0 && emSeparacao.length === 0 && emConferencia.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PackageOpen size={28} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Nenhum pedido na fila</h3>
                <p className="text-sm text-gray-400 mt-1">Novos pedidos aparecerão aqui quando chegarem.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3">
              {pendentes.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-all flex items-center gap-5">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-700">#{p.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{p.cliente}</div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{p.itens.length} itens</span>
                      <span className="text-gray-300">·</span>
                      <span>{p.itens.reduce((acc, i) => acc + i.quantidade, 0)} {p.itens[0]?.unidade || 'un'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => assumirPedido(p)}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 hover:bg-black shadow-sm transition-all shrink-0"
                  >
                    <Play size={16} /> Assumir
                  </button>
                </div>
              ))}

              {emSeparacao.length > 0 && (
                <>
                  <div className="pt-4 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Em separação (retomar)</span>
                  </div>
                  {emSeparacao.map(p => {
                    const t = p.itens.length;
                    const c = p.itens.filter(i => i.separado).length;
                    return (
                      <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all flex items-center gap-5">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">#{p.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900">{p.cliente}</div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{c}/{t} itens</span>
                            <span className="text-gray-300">·</span>
                            <span>{p.assumidoPor || 'Você'}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${t > 0 ? (c / t) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <button
                          onClick={() => retomarPedido(p)}
                          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-all shrink-0"
                        >
                          Retomar <ArrowRight size={16} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {emConferencia.length > 0 && (
                <>
                  <div className="pt-4 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Em conferência</span>
                  </div>
                  {emConferencia.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100/50 flex items-center gap-5 opacity-60">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-gray-500">#{p.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-700">{p.cliente}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {p.itens.length} itens · Aguardando conferência
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">Conferência</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* PASSO 2 — SEPARAÇÃO */}
      {step === 'separacao' && pedidoAtivo && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Passo 2 de 3</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                Separar Pedido #{pedidoAtivo.id}
              </h1>
              <p className="text-gray-500 mt-1">{pedidoAtivo.cliente} — {nome || 'Operador'}</p>
            </div>
            <button
              onClick={voltarParaFila}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-all"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>

          {/* Progresso */}
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Progresso da Separação</span>
              <span className="text-sm font-bold text-gray-900">{itensSeparados}/{totalItens} itens</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>{totalItens - itensSeparados} restantes</span>
              <span className="text-gray-300">·</span>
              <span>{Math.round(progresso)}% concluído</span>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {pedidoAtivo.itens.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => !item.separado && toggleItem(item.id)}
                className={`bg-white p-4 rounded-2xl shadow-sm ring-1 transition-all flex items-center gap-4 ${
                  item.separado
                    ? 'ring-gray-300 bg-gray-50/50'
                    : 'ring-gray-100/50 hover:ring-gray-300 cursor-pointer hover:shadow-md'
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm bg-gray-100 text-gray-500">
                  {idx + 1}
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0 border border-gray-300 bg-white">
                  {item.separado && (
                    <div className="w-full h-full bg-primary rounded-md flex items-center justify-center">
                      <Check size={14} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold block ${item.separado ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.nome}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium">{item.quantidade} {item.unidade}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <MapPin size={10} /> {item.localizacao}
                    </span>
                  </div>
                </div>
                {item.separado && item.separadoPor && (
                  <span className="text-[10px] text-gray-500 shrink-0">{item.separadoPor}</span>
                )}
              </div>
            ))}
          </div>

          {/* Botão Finalizar */}
          <div className="pt-2">
            <button
              onClick={concluirSeparacao}
              disabled={!todosSeparados}
              className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                todosSeparados
                  ? 'bg-primary text-white hover:bg-black shadow-lg shadow-black/10'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {todosSeparados ? 'FINALIZAR SEPARAÇÃO' : `Separe todos os itens primeiro (${itensSeparados}/${totalItens})`}
            </button>
          </div>
        </>
      )}

      {/* PASSO 3 — CONCLUÍDO */}
      {step === 'concluido' && pedidoAtivo && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center anim-scale-in">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Separação Concluída</h1>
            <p className="text-gray-500 text-lg mb-8">Pedido #{pedidoAtivo.id} — {pedidoAtivo.cliente}</p>

            <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-100/50 inline-block mb-8">
              <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 mb-4">
                <QrCode size={64} className="text-gray-400" />
              </div>
              <span className="text-sm font-mono font-bold text-gray-700 tracking-widest">QR-{pedidoAtivo.id}</span>
              <p className="text-xs text-gray-400 mt-2">Encaminhado para conferência</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPedidoAtivo(null); setStep('fila'); carregar(); }}
                className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-black transition-all"
              >
                <ArrowLeft size={16} /> Voltar à Fila
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
