import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, Package, ArrowLeft, Loader2, Calendar, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlug } from '../services/tenantSetup';
import { relatorioService, type VendasPeriodo, type TopProduto, type ClienteTop, type DesempenhoVendedor, type EstoqueMargem } from '../services/relatorioService';

type TabId = 'vendas' | 'produtos' | 'clientes' | 'vendedores' | 'estoque';

function formatPreco(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDataInput(d: Date) {
  return d.toISOString().split('T')[0];
}

function inicioMes() {
  const d = new Date();
  d.setDate(1);
  return formatDataInput(d);
}

export default function Relatorios() {
  const [tab, setTab] = useState<TabId>('vendas');
  const [dataInicio, setDataInicio] = useState(inicioMes);
  const [dataFim, setDataFim] = useState(formatDataInput(new Date()));
  const [carregando, setCarregando] = useState(false);

  const [vendas, setVendas] = useState<VendasPeriodo | null>(null);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [clientesTop, setClientesTop] = useState<ClienteTop[]>([]);
  const [vendedores, setVendedores] = useState<DesempenhoVendedor[]>([]);
  const [estoque, setEstoque] = useState<EstoqueMargem[]>([]);

  const carregar = async () => {
    setCarregando(true);
    const params = { dataInicio, dataFim };
    const [v, p, c, ve, es] = await Promise.all([
      relatorioService.getVendasPeriodo({ ...params, agrupamento: 'diario' }),
      relatorioService.getTopProdutos({ ...params, limite: 20 }),
      relatorioService.getClientesTop({ ...params, limite: 20 }),
      relatorioService.getDesempenhoVendedor(params),
      relatorioService.getEstoqueMargem({ ...params, limite: 30 }),
    ]);
    setVendas(v);
    setTopProdutos(p);
    setClientesTop(c);
    setVendedores(ve);
    setEstoque(es);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'vendas', label: 'Vendas', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos', icon: ShoppingBag },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'vendedores', label: 'Vendedores', icon: TrendingUp },
    { id: 'estoque', label: 'Estoque', icon: Package },
  ];

  const maxValor = vendas ? Math.max(...vendas.dados.map(d => d.valorTotal), 1) : 1;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to={`/${getSlug()}`} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Métricas de vendas, produtos e clientes.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${tab === t.id ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            <span className="text-gray-400">até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <button onClick={carregar} disabled={carregando}
            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50">
            {carregando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Gerar Relatório
          </button>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Carregando dados...
          </div>
        ) : (
          <>
            {tab === 'vendas' && vendas && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{vendas.totalPedidos}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatPreco(vendas.valorTotalGeral)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatPreco(vendas.ticketMedioGeral)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Vendas por Dia</h3>
                  <div className="space-y-2">
                    {vendas.dados.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{d.periodo}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div className="bg-gray-900 h-full rounded-full flex items-center px-3 transition-all" style={{ width: `${Math.max((d.valorTotal / maxValor) * 100, 8)}%` }}>
                            <span className="text-[10px] font-bold text-white whitespace-nowrap">{formatPreco(d.valorTotal)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{d.totalPedidos}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'produtos' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Produtos Mais Vendidos</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 font-semibold text-gray-600">#</th>
                      <th className="pb-2 font-semibold text-gray-600">Produto</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Qtd Vendida</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Valor Total</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Pedidos</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProdutos.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>
                    ) : topProdutos.map((p, i) => (
                      <tr key={p.produtoId} className="border-b border-gray-100">
                        <td className="py-3 text-gray-400">{i + 1}</td>
                        <td className="py-3 font-medium text-gray-900">{p.produtoNome}</td>
                        <td className="py-3 text-right">{p.quantidadeVendida}</td>
                        <td className="py-3 text-right font-semibold">{formatPreco(p.valorTotal)}</td>
                        <td className="py-3 text-right text-gray-500">{p.numPedidos}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-gray-900 h-full rounded-full" style={{ width: `${p.percentual}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">{p.percentual}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'clientes' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Clientes que Mais Compram</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 font-semibold text-gray-600">#</th>
                      <th className="pb-2 font-semibold text-gray-600">Cliente</th>
                      <th className="pb-2 font-semibold text-gray-600">CPF/CNPJ</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Pedidos</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Valor Total</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesTop.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>
                    ) : clientesTop.map((c, i) => (
                      <tr key={c.clienteId} className="border-b border-gray-100">
                        <td className="py-3 text-gray-400">{i + 1}</td>
                        <td className="py-3 font-medium text-gray-900">{c.clienteNome}</td>
                        <td className="py-3 text-gray-500">{c.cpfCnpj}</td>
                        <td className="py-3 text-right">{c.totalPedidos}</td>
                        <td className="py-3 text-right font-semibold">{formatPreco(c.valorTotal)}</td>
                        <td className="py-3 text-right text-gray-500">{formatPreco(c.ticketMedio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'vendedores' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Desempenho por Vendedor</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 font-semibold text-gray-600">#</th>
                      <th className="pb-2 font-semibold text-gray-600">Vendedor</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Pedidos</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Clientes</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Valor Total</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>
                    ) : vendedores.map((v, i) => (
                      <tr key={v.vendedorId} className="border-b border-gray-100">
                        <td className="py-3 text-gray-400">{i + 1}</td>
                        <td className="py-3 font-medium text-gray-900">{v.vendedorNome}</td>
                        <td className="py-3 text-right">{v.totalPedidos}</td>
                        <td className="py-3 text-right">{v.numClientes}</td>
                        <td className="py-3 text-right font-semibold">{formatPreco(v.valorTotal)}</td>
                        <td className="py-3 text-right text-gray-500">{formatPreco(v.ticketMedio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'estoque' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Estoque e Giro de Produtos</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 font-semibold text-gray-600">Produto</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Estoque</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Vendido</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Receita</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Preço Varejo</th>
                      <th className="pb-2 font-semibold text-gray-600 text-right">Giro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoque.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>
                    ) : estoque.map(e => (
                      <tr key={e.produtoId} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-gray-900">{e.produtoNome}</td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold ${e.estoqueAtual <= 0 ? 'text-red-600' : e.estoqueAtual <= 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {e.estoqueAtual}
                          </span>
                        </td>
                        <td className="py-3 text-right">{e.quantidadeVendida}</td>
                        <td className="py-3 text-right font-semibold">{formatPreco(e.receitaTotal)}</td>
                        <td className="py-3 text-right text-gray-500">{formatPreco(e.precoVarejo)}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.giroEstoque >= 5 ? 'bg-emerald-100 text-emerald-700' : e.giroEstoque >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {e.giroEstoque}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
