import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Loader2, ArrowLeft, BadgePercent, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlug } from '../services/tenantSetup';
import { cupomService, type Cupom, type CriarCupomDto } from '../services/cupomService';
import { produtoService, type Produto } from '../services/produtoService';
import { clienteService, type Cliente } from '../services/clienteService';

const formVazio: CriarCupomDto = {
  codigo: '', descricao: '', tipo: 'percentual', valor: 10, aplicavelEm: 'pedido',
  valorMinimoPedido: null, valorMaximoDesconto: null, usosMaximos: null,
  dataInicio: null, dataFim: null, ativa: true, produtos: [], clientes: [],
};

function formatarData(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function dataParaInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inputParaData(v: string): string | null {
  if (!v) return null;
  const [ano, mes, dia] = v.split('-');
  return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia))).toISOString();
}

function estaVigente(c: Cupom) {
  if (!c.ativo) return false;
  const agora = Date.now();
  const ini = c.dataInicio ? new Date(c.dataInicio).getTime() : null;
  const fim = c.dataFim ? new Date(c.dataFim).getTime() : null;
  if (ini && agora < ini) return false;
  if (fim && agora > fim) return false;
  if (c.usosMaximos != null && c.usosRealizados >= c.usosMaximos) return false;
  return true;
}

function descricaoDesconto(c: Cupom) {
  if (c.tipo === 'frete_gratis') return 'Frete grátis';
  if (c.tipo === 'percentual') return `${Math.round(c.valor)}% de desconto`;
  return `R$ ${c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de desconto`;
}

function descricaoAplicavel(c: Cupom) {
  if (c.aplicavelEm === 'frete') return 'No frete';
  if (c.aplicavelEm === 'produtos') {
    const qtd = c.produtos?.length ?? 0;
    return qtd > 0 ? `Em ${qtd} produto${qtd !== 1 ? 's' : ''}` : 'Em produtos específicos';
  }
  return 'No pedido inteiro';
}

export default function ComercialCupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalTipo, setModalTipo] = useState<'criar' | 'editar' | null>(null);
  const [selecionada, setSelecionada] = useState<Cupom | null>(null);
  const [form, setForm] = useState<CriarCupomDto>(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const [lista, prods, clis] = await Promise.all([
      cupomService.getCupons(),
      produtoService.getProdutos(),
      clienteService.getClientes(),
    ]);
    setCupons(lista);
    setProdutos(prods);
    setClientes(clis);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => {
    setForm(formVazio);
    setSelecionada(null);
    setErro('');
    setModalTipo('criar');
  };

  const abrirEditar = (c: Cupom) => {
    setForm({
      codigo: c.codigo,
      descricao: c.descricao ?? '',
      tipo: c.tipo,
      valor: c.valor,
      aplicavelEm: c.aplicavelEm,
      valorMinimoPedido: c.valorMinimoPedido,
      valorMaximoDesconto: c.valorMaximoDesconto,
      usosMaximos: c.usosMaximos,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      ativa: c.ativo,
      produtos: (c.produtos ?? []).map(cp => ({ produtoId: cp.produtoId })),
      clientes: (c.clientes ?? []).map(cc => ({ clienteId: cc.clienteId })),
    });
    setSelecionada(c);
    setErro('');
    setModalTipo('editar');
  };

  const salvar = async () => {
    if (!form.codigo.trim() || form.valor <= 0) return;
    setSalvando(true);
    setErro('');
    try {
      let ok: boolean;
      if (modalTipo === 'criar') {
        ok = !!(await cupomService.criarCupom(form));
      } else if (selecionada) {
        ok = await cupomService.atualizarCupom(selecionada.id, form);
      } else {
        ok = false;
      }
      if (!ok) {
        setErro('Não foi possível salvar o cupom.');
        return;
      }
      setModalTipo(null);
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (c: Cupom) => {
    if (!confirm(`Deseja excluir o cupom "${c.codigo}"?`)) return;
    await cupomService.deletarCupom(c.id);
    await carregar();
  };

  const toggleProduto = (id: number) => {
    setForm(f => ({
      ...f,
      produtos: f.produtos.some(x => x.produtoId === id)
        ? f.produtos.filter(x => x.produtoId !== id)
        : [...f.produtos, { produtoId: id }],
    }));
  };

  const toggleCliente = (id: number) => {
    setForm(f => ({
      ...f,
      clientes: f.clientes.some(x => x.clienteId === id)
        ? f.clientes.filter(x => x.clienteId !== id)
        : [...f.clientes, { clienteId: id }],
    }));
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const clientesFiltrados = clientes.filter(c =>
    c.razaoSocialNome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    (c.cpfCnpj ?? '').includes(buscaCliente)
  );

  const inputClass = "w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to={`/${getSlug()}/comercial`} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie cupons para seus clientes.</p>
        </div>
        <button onClick={abrirCriar} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary flex items-center gap-2 shadow-sm shadow-black/20 transition-colors">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {carregando ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mr-2" size={20} /> Carregando...
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Código</th>
                  <th className="px-6 py-3 font-semibold">Desconto</th>
                  <th className="px-6 py-3 font-semibold">Aplicação</th>
                  <th className="px-6 py-3 font-semibold">Período</th>
                  <th className="px-6 py-3 font-semibold">Usos</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Nenhum cupom criado ainda.</td></tr>
                ) : cupons.map(c => {
                  const vigente = estaVigente(c);
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-gray-900">{c.codigo}</p>
                            {c.descricao && <p className="text-xs text-gray-400 truncate">{c.descricao}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{descricaoDesconto(c)}</td>
                      <td className="px-6 py-4 text-gray-600">{descricaoAplicavel(c)}</td>
                      <td className="px-6 py-4">
                        {formatarData(c.dataInicio)} → {formatarData(c.dataFim)}
                      </td>
                      <td className="px-6 py-4">
                        {c.usosRealizados}{c.usosMaximos != null ? ` / ${c.usosMaximos}` : ''}
                      </td>
                      <td className="px-6 py-4">
                        {vigente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">Ativo</span>
                        ) : c.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 ring-1 ring-amber-200">Agendado/Expirado</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 ring-1 ring-gray-200">Inativo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => abrirEditar(c)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                            <Pencil size={14} className="text-gray-500" />
                          </button>
                          <button onClick={() => deletar(c)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Excluir">
                            <Trash2 size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalTipo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {modalTipo === 'criar' ? 'Novo Cupom' : 'Editar Cupom'}
              </h2>
              <button onClick={() => setModalTipo(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Código do Cupom *</label>
                  <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className={`${inputClass} font-mono`} placeholder="Ex.: VERAO10" maxLength={50} />
                </div>
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input type="text" value={form.descricao ?? ''} onChange={e => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Breve descrição..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo de desconto</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, tipo: 'percentual' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipo === 'percentual' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Percentual (%)
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, tipo: 'valor_fixo' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipo === 'valor_fixo' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Valor (R$)
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, tipo: 'frete_gratis' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipo === 'frete_gratis' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Frete Grátis
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{form.tipo === 'percentual' ? 'Desconto (%)' : form.tipo === 'frete_gratis' ? 'Valor (0)' : 'Desconto (R$)'} *</label>
                  <input type="number" step={form.tipo === 'percentual' ? 1 : 0.01} min={0} max={form.tipo === 'percentual' ? 100 : undefined}
                    value={form.valor} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} className={inputClass}
                    disabled={form.tipo === 'frete_gratis'} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Aplicável em</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, aplicavelEm: 'pedido' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.aplicavelEm === 'pedido' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Pedido
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, aplicavelEm: 'produtos' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.aplicavelEm === 'produtos' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Produtos
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, aplicavelEm: 'frete' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.aplicavelEm === 'frete' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Frete
                    </button>
                  </div>
                </div>
                <div />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Valor mínimo do pedido (R$)</label>
                  <input type="number" step="0.01" min={0} value={form.valorMinimoPedido ?? ''} onChange={e => setForm({ ...form, valorMinimoPedido: e.target.value === '' ? null : parseFloat(e.target.value) || null })} className={inputClass} placeholder="Sem mínimo" />
                </div>
                <div>
                  <label className={labelClass}>Limite máx. desconto (R$)</label>
                  <input type="number" step="0.01" min={0} value={form.valorMaximoDesconto ?? ''} onChange={e => setForm({ ...form, valorMaximoDesconto: e.target.value === '' ? null : parseFloat(e.target.value) || null })} className={inputClass} placeholder="Sem limite" />
                </div>
                <div>
                  <label className={labelClass}>Limite de usos</label>
                  <input type="number" step={1} min={0} value={form.usosMaximos ?? ''} onChange={e => setForm({ ...form, usosMaximos: e.target.value === '' ? null : parseInt(e.target.value) || null })} className={inputClass} placeholder="Ilimitado" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Início</label>
                  <input type="date" value={dataParaInput(form.dataInicio)} onChange={e => setForm({ ...form, dataInicio: inputParaData(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fim</label>
                  <input type="date" value={dataParaInput(form.dataFim)} onChange={e => setForm({ ...form, dataFim: inputParaData(e.target.value) })} className={inputClass} />
                </div>
              </div>

              {form.aplicavelEm === 'produtos' && (
                <div>
                  <label className={labelClass}>Produtos elegíveis ({form.produtos.length} selecionado{form.produtos.length !== 1 ? 's' : ''})</label>
                  <input type="text" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className={`${inputClass} mb-2`} placeholder="Buscar produto..." />
                  <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-48">
                    {produtosFiltrados.length === 0 ? (
                      <p className="p-4 text-sm text-gray-400 text-center">Nenhum produto encontrado.</p>
                    ) : produtosFiltrados.map(p => {
                      const marcado = form.produtos.some(x => x.produtoId === p.id);
                      return (
                        <button type="button" key={p.id} onClick={() => toggleProduto(p.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${marcado ? 'bg-primary/5' : ''}`}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${marcado ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                            {marcado && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span className={`flex-1 truncate ${marcado ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{p.nome}</span>
                          <span className="text-xs text-gray-400">R$ {p.precoVarejo.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Restrição de clientes ({form.clientes.length} selecionado{form.clientes.length !== 1 ? 's' : ''})</label>
                <p className="text-xs text-gray-400 mb-2">Se nenhum cliente for selecionado, o cupom será válido para todos.</p>
                <input type="text" value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} className={`${inputClass} mb-2`} placeholder="Buscar cliente..." />
                <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-40">
                  {clientesFiltrados.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Nenhum cliente encontrado.</p>
                  ) : clientesFiltrados.map(c => {
                    const marcado = form.clientes.some(x => x.clienteId === c.id);
                    return (
                      <button type="button" key={c.id} onClick={() => toggleCliente(c.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${marcado ? 'bg-primary/5' : ''}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${marcado ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {marcado && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className={`flex-1 truncate ${marcado ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{c.razaoSocialNome}</span>
                        {c.cpfCnpj && <span className="text-xs text-gray-400 shrink-0">{c.cpfCnpj}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ativa} onChange={e => setForm({ ...form, ativa: e.target.checked })} className="h-4 w-4 accent-primary" />
                <span className="text-sm text-gray-700 font-medium">Cupom ativo</span>
              </label>

              {erro && <p className="text-sm text-red-600">{erro}</p>}
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setModalTipo(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={salvar} disabled={!form.codigo.trim() || form.valor <= 0 || salvando}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.codigo.trim() && form.valor > 0 && !salvando ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {salvando ? 'Salvando...' : modalTipo === 'criar' ? 'Criar Cupom' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
