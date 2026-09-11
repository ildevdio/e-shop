import { useState, useEffect, useCallback } from 'react';
import { PackageOpen, Truck, CheckCircle2, MapPin, Package, ArrowRight, Search, Loader2, Boxes } from 'lucide-react';
import { logisticaService, type PedidoPronto } from '../services/logisticaService';
import { useSistemaStore } from '../store/sistemaStore';

type TabExpedicao = 'prontos' | 'transporte' | 'entregues';

const nomeCliente = (p: PedidoPronto) => p.cliente?.razaoSocialNome ?? 'Cliente #' + p.clienteId;
const enderecoStr = (p: PedidoPronto) => {
  const c = p.cliente;
  if (!c) return '';
  const rua = `${c.logradouro ?? ''}, ${c.numero ?? ''}`.trim().replace(/^,\s*/, '');
  return [rua, c.bairro].filter(Boolean).join(' · ');
};

function CardPedido({
  pedido,
  selecionado,
  onToggleSelecao,
  acoes,
  usarPeso,
}: {
  pedido: PedidoPronto;
  selecionado?: boolean;
  onToggleSelecao?: () => void;
  acoes?: React.ReactNode;
  usarPeso?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border p-4 transition-all ${selecionado ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {onToggleSelecao && (
            <button
              onClick={onToggleSelecao}
              className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${selecionado ? 'bg-primary border-primary' : 'border-gray-300'}`}
            >
              {selecionado && <CheckCircle2 size={14} className="text-white" />}
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">#{pedido.id}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{pedido.status}</span>
            </div>
            <div className="font-medium text-gray-900 text-sm mt-0.5">{nomeCliente(pedido)}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-gray-900 text-sm">R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-400">{pedido.itens?.length ?? 0} itens</div>
        </div>
      </div>

      {enderecoStr(pedido) && (
        <div className="flex items-start gap-2 text-gray-500 text-sm mt-3">
          <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="leading-snug">{enderecoStr(pedido)}</p>
        </div>
      )}

      {usarPeso && pedido.pesoTotal > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
          <Package size={13} className="text-gray-400" /> {pedido.pesoTotal} kg
        </div>
      )}

      {acoes && <div className="mt-3 pt-3 border-t border-gray-100">{acoes}</div>}
    </div>
  );
}

export default function Expedicao() {
  const config = useSistemaStore((state) => state.config);
  const usarPeso = config.usarPeso ?? true;

  const [tab, setTab] = useState<TabExpedicao>('prontos');
  const [prontos, setProntos] = useState<PedidoPronto[]>([]);
  const [transporte, setTransporte] = useState<PedidoPronto[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [despachando, setDespachando] = useState(false);
  const [buscando, setBuscando] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [prontosData, transporteData] = await Promise.all([
      logisticaService.getPedidosProntos(),
      logisticaService.getEmTransporte(),
    ]);
    setProntos(prontosData);
    setTransporte(transporteData);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const toggleSelecao = (id: number) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const despachar = async () => {
    if (selecionados.size === 0) return;
    setDespachando(true);
    const ok = await logisticaService.despacharTerceirizada([...selecionados]);
    setDespachando(false);
    if (ok) {
      setSelecionados(new Set());
      await carregar();
      setTab('transporte');
    }
  };

  const confirmarEntrega = async (pedidoId: number) => {
    const ok = await logisticaService.confirmarEntregaTerceirizada(pedidoId);
    if (ok) await carregar();
  };

  const prontosFiltrados = prontos.filter((p) =>
    !buscando.trim() ||
    `${p.id} ${nomeCliente(p)}`.toLowerCase().includes(buscando.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <PackageOpen size={28} /> Saída de Entregas
          </h1>
          <p className="text-gray-500 mt-1">Expedição de pedidos para a transportadora.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
          <span className="font-bold text-gray-900">{prontos.length}</span> pronto(s) para despacho
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-1">
        {[
          { id: 'prontos' as const, label: 'Prontos p/ Despacho', icon: Boxes },
          { id: 'transporte' as const, label: 'Em Transporte', icon: Truck },
          { id: 'entregues' as const, label: 'Entregues', icon: CheckCircle2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${tab === t.id ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
          >
            <t.icon size={18} />
            {t.label}
            <span className="text-xs font-semibold bg-gray-100 rounded-full px-2 py-0.5">
              {t.id === 'prontos' ? prontos.length : t.id === 'transporte' ? transporte.length : prontos.filter(p => p.status === 'Entregue').length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="border-b border-gray-100 px-6 py-3 flex items-center gap-3 bg-gray-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={buscando}
              onChange={(e) => setBuscando(e.target.value)}
              placeholder={tab === 'prontos' ? 'Buscar pedido ou cliente...' : 'Buscar...'}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2 text-sm"><Loader2 size={18} className="animate-spin" /> Carregando... </div>
          ) : tab === 'prontos' && prontosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhum pedido pronto para despacho.</div>
          ) : tab === 'transporte' && transporte.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhum pedido em transporte.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tab === 'prontos' && prontosFiltrados.map((p) => (
                <CardPedido
                  key={p.id}
                  pedido={p}
                  usarPeso={usarPeso}
                  selecionado={selecionados.has(p.id)}
                  onToggleSelecao={() => toggleSelecao(p.id)}
                />
              ))}
              {tab === 'transporte' && transporte.map((p) => (
                <CardPedido
                  key={p.id}
                  pedido={p}
                  usarPeso={usarPeso}
                  acoes={
                    <button
                      onClick={() => confirmarEntrega(p.id)}
                      className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle2 size={16} /> Confirmar Entrega
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>

        {tab === 'prontos' && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              {selecionados.size} selecionado(s)
            </span>
            <button
              onClick={despachar}
              disabled={selecionados.size === 0 || despachando}
              className={`bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${selecionados.size === 0 || despachando ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}`}
            >
              {despachando ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Despachar à transportadora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
