import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Loader2, ArrowLeft, BadgePercent, MessageCircle, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlug } from '../services/tenantSetup';
import { promocaoService, type Promocao, type CriarPromocaoDto } from '../services/promocaoService';
import { produtoService, type Produto } from '../services/produtoService';
import { clienteService, type Cliente } from '../services/clienteService';

const formVazio: CriarPromocaoDto = {
  titulo: '', descricao: '', tipo: 'percentual', valor: 10, dataInicio: null, dataFim: null, ativa: true, produtos: [],
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

function estaVigente(p: Promocao) {
  if (!p.ativa) return false;
  const agora = Date.now();
  const ini = p.dataInicio ? new Date(p.dataInicio).getTime() : null;
  const fim = p.dataFim ? new Date(p.dataFim).getTime() : null;
  if (ini && agora < ini) return false;
  if (fim && agora > fim) return false;
  return true;
}

function descricaoDesconto(p: Promocao) {
  const comPreco = (p.produtos ?? []).filter(pp => pp.precoPromocional != null).length;
  const total = p.produtos?.length ?? 0;
  if (comPreco > 0) {
    return comPreco === total
      ? `Preço promocional em ${comPreco} ${comPreco === 1 ? 'produto' : 'produtos'}`
      : `Preço promocional em ${comPreco} de ${total}`;
  }
  if (p.tipo === 'percentual') return `${Math.round(p.valor)}% de desconto`;
  return `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de desconto`;
}

function normalizarWhatsApp(telefone: string) {
  let d = telefone.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (!d.startsWith('55')) d = '55' + d;
  return d;
}

export default function ComercialPromocoes() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalTipo, setModalTipo] = useState<'criar' | 'editar' | null>(null);
  const [selecionada, setSelecionada] = useState<Promocao | null>(null);
  const [form, setForm] = useState<CriarPromocaoDto>(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [modalCampanha, setModalCampanha] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [mensagem, setMensagem] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const [lista, prods] = await Promise.all([promocaoService.getPromocoes(), produtoService.getProdutos()]);
    setPromocoes(lista);
    setProdutos(prods);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const nomeProdutos = (p: Promocao) => {
    const nomes = (p.produtos ?? [])
      .map(pp => pp.produto?.nome ?? `Produto #${pp.produtoId}`)
      .slice(0, 3);
    const resto = (p.produtos?.length ?? 0) - nomes.length;
    return nomes.join(', ') + (resto > 0 ? ` e +${resto}` : '');
  };

  const abrirCriar = () => {
    setForm(formVazio);
    setSelecionada(null);
    setErro('');
    setModalTipo('criar');
  };

  const abrirEditar = (p: Promocao) => {
    setForm({
      titulo: p.titulo, descricao: p.descricao ?? '', tipo: p.tipo, valor: p.valor,
      dataInicio: p.dataInicio, dataFim: p.dataFim, ativa: p.ativa,
      produtos: (p.produtos ?? []).map(pp => ({ produtoId: pp.produtoId, precoPromocional: pp.precoPromocional })),
    });
    setSelecionada(p);
    setErro('');
    setModalTipo('editar');
  };

  const salvar = async () => {
    if (!form.titulo.trim() || form.valor <= 0) return;
    if (form.produtos.length === 0) {
      setErro('Selecione ao menos um produto para a promoção.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      let ok: boolean;
      if (modalTipo === 'criar') {
        ok = !!(await promocaoService.criarPromocao(form));
      } else if (selecionada) {
        ok = await promocaoService.atualizarPromocao(selecionada.id, form);
      } else {
        ok = false;
      }
      if (!ok) {
        setErro('Não foi possível salvar a promoção.');
        return;
      }
      setModalTipo(null);
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (p: Promocao) => {
    if (!confirm(`Deseja excluir a promoção "${p.titulo}"?`)) return;
    await promocaoService.deletarPromocao(p.id);
    await carregar();
  };

  const toggleProduto = (id: number) => {
    setForm(f => ({
      ...f,
      produtos: f.produtos.some(x => x.produtoId === id)
        ? f.produtos.filter(x => x.produtoId !== id)
        : [...f.produtos, { produtoId: id, precoPromocional: null }],
    }));
  };

  const setPrecoProduto = (id: number, preco: number | null) => {
    setForm(f => ({
      ...f,
      produtos: f.produtos.map(x => x.produtoId === id ? { ...x, precoPromocional: preco } : x),
    }));
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const abrirCampanha = (p?: Promocao) => {
    setModalCampanha(true);
    setSelecionados(new Set());
    setBuscaCliente('');
    setMensagem(p
      ? `Olá! 🎉 Aproveite nossa promoção "${p.titulo}" — ${descricaoDesconto(p)}! Válida até ${formatarData(p.dataFim)}. Não perca!`
      : 'Olá! Temos uma promoção especial esperando por você na nossa loja. Aproveite!');
    if (clientes.length === 0) clienteService.getClientes().then(setClientes);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.razaoSocialNome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    (c.telefone ?? '').includes(buscaCliente) ||
    (c.email ?? '').toLowerCase().includes(buscaCliente.toLowerCase())
  );

  const alternarCliente = (id: number) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const alternarTodos = () => {
    setSelecionados(prev => {
      const ids = clientesFiltrados.map(c => c.id);
      const todosSelecionados = ids.length > 0 && ids.every(id => prev.has(id));
      const novo = new Set(prev);
      ids.forEach(id => todosSelecionados ? novo.delete(id) : novo.add(id));
      return novo;
    });
  };

  const enviarCampanha = () => {
    const alvos = clientes.filter(c => selecionados.has(c.id) && c.telefone);
    if (alvos.length === 0) return;
    const texto = encodeURIComponent(mensagem || 'Olá! Aproveite nossas promoções!');
    alvos.forEach(c => {
      window.open(`https://wa.me/${normalizarWhatsApp(c.telefone!)}?text=${texto}`, '_blank', 'noopener');
    });
  };

  const inputClass = "w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to={`/${getSlug()}/comercial`} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Promoções</h1>
          <p className="text-gray-500 mt-1">Descontos em produtos e campanhas de WhatsApp para clientes.</p>
        </div>
        <button onClick={() => abrirCampanha()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm shadow-black/20 transition-colors">
          <MessageCircle size={18} /> Campanha WhatsApp
        </button>
        <button onClick={abrirCriar} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary flex items-center gap-2 shadow-sm shadow-black/20 transition-colors">
          <Plus size={18} /> Nova Promoção
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
                  <th className="px-6 py-3 font-semibold">Promoção</th>
                  <th className="px-6 py-3 font-semibold">Desconto</th>
                  <th className="px-6 py-3 font-semibold">Período</th>
                  <th className="px-6 py-3 font-semibold">Produtos</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {promocoes.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhuma promoção criada ainda.</td></tr>
                ) : promocoes.map(p => {
                  const vigente = estaVigente(p);
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BadgePercent size={16} className="text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.titulo}</p>
                            {p.descricao && <p className="text-xs text-gray-400 truncate">{p.descricao}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{descricaoDesconto(p)}</td>
                      <td className="px-6 py-4">
                        {formatarData(p.dataInicio)} → {formatarData(p.dataFim)}
                      </td>
                      <td className="px-6 py-4 max-w-[260px] truncate">{nomeProdutos(p)}</td>
                      <td className="px-6 py-4">
                        {vigente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">Ativa</span>
                        ) : p.ativa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 ring-1 ring-amber-200">Agendada/Expirada</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 ring-1 ring-gray-200">Inativa</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => abrirCampanha(p)} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Campanha WhatsApp">
                            <MessageCircle size={14} className="text-emerald-600" />
                          </button>
                          <button onClick={() => abrirEditar(p)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                            <Pencil size={14} className="text-gray-500" />
                          </button>
                          <button onClick={() => deletar(p)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Excluir">
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
                {modalTipo === 'criar' ? 'Nova Promoção' : 'Editar Promoção'}
              </h2>
              <button onClick={() => setModalTipo(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Título *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className={inputClass} placeholder="Ex.: Semana da Castanha" />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <input type="text" value={form.descricao ?? ''} onChange={e => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Breve descrição..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo de desconto</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, tipo: 'percentual' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipo === 'percentual' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Percentual (%)
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, tipo: 'valor' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipo === 'valor' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      Valor (R$)
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{form.tipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'} *</label>
                  <input type="number" step={form.tipo === 'percentual' ? 1 : 0.01} min={0} max={form.tipo === 'percentual' ? 100 : undefined}
                    value={form.valor} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} className={inputClass} />
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

              <div>
                <label className={labelClass}>Produtos em promoção ({form.produtos.length} selecionado{form.produtos.length !== 1 ? 's' : ''})</label>
                <input type="text" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className={`${inputClass} mb-2`} placeholder="Buscar produto..." />
                <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-52">
                  {produtosFiltrados.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Nenhum produto encontrado.</p>
                  ) : produtosFiltrados.map(p => {
                    const marcado = form.produtos.some(x => x.produtoId === p.id);
                    return (
                      <button type="button" key={p.id} onClick={() => toggleProduto(p.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${marcado ? 'bg-primary/5' : ''}`}>
                        {marcado ? <CheckSquare size={16} className="text-primary shrink-0" /> : <Square size={16} className="text-gray-300 shrink-0" />}
                        <span className={`flex-1 truncate ${marcado ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{p.nome}</span>
                        <span className="text-xs text-gray-400">R$ {p.precoVarejo.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>

                {form.produtos.length > 0 && (
                  <div className="mt-3">
                    <label className={labelClass}>Preços promocionais (R$)</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Preencha o preço de venda de cada produto. Deixe vazio para usar o desconto
                      {form.tipo === 'percentual' ? ` de ${Math.round(form.valor)}%` : ` de R$ ${form.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}.
                    </p>
                    <div className="space-y-2">
                      {form.produtos.map(({ produtoId, precoPromocional }) => {
                        const prod = produtos.find(x => x.id === produtoId);
                        if (!prod) return null;
                        return (
                          <div key={produtoId} className="flex items-center gap-2 border border-gray-200 rounded-xl p-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{prod.nome}</p>
                              <p className="text-[11px] text-gray-400">
                                Varejo: R$ {prod.precoVarejo.toFixed(2)}
                                {(prod.precoAtacado ?? 0) > 0 && ` · Atacado: R$ ${(prod.precoAtacado ?? 0).toFixed(2)}`}
                              </p>
                            </div>
                            <div className="shrink-0 w-32">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={precoPromocional ?? ''}
                                placeholder="Usar desconto"
                                onChange={e => setPrecoProduto(produtoId, e.target.value === '' ? null : (parseFloat(e.target.value) || 0))}
                                className={inputClass}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ativa} onChange={e => setForm({ ...form, ativa: e.target.checked })} className="h-4 w-4 accent-primary" />
                <span className="text-sm text-gray-700 font-medium">Promoção ativa</span>
              </label>

              {erro && <p className="text-sm text-red-600">{erro}</p>}
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setModalTipo(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo.trim() || form.valor <= 0 || form.produtos.length === 0 || salvando}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.titulo.trim() && form.valor > 0 && form.produtos.length > 0 && !salvando ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {salvando ? 'Salvando...' : modalTipo === 'criar' ? 'Criar Promoção' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCampanha && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Campanha WhatsApp</h2>
              <button onClick={() => setModalCampanha(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className={labelClass}>Mensagem</label>
                <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={4} className={inputClass} placeholder="Digite a mensagem da campanha..." />
                <p className="text-xs text-gray-400 mt-1">A mensagem será aberta no WhatsApp de cada cliente selecionado.</p>
              </div>

              <div>
                <label className={labelClass}>Clientes selecionados: {selecionados.size}</label>
                <input type="text" value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} className={`${inputClass} mb-2`} placeholder="Buscar cliente..." />
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <button onClick={alternarTodos} className="text-xs font-medium text-primary flex items-center gap-1.5">
                      {clientesFiltrados.length > 0 && clientesFiltrados.every(c => selecionados.has(c.id)) ? <CheckSquare size={14} /> : <Square size={14} />}
                      Selecionar todos
                    </button>
                    <span className="text-xs text-gray-400">{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <p className="p-4 text-sm text-gray-400 text-center">Nenhum cliente encontrado.</p>
                    ) : clientesFiltrados.map(c => {
                      const marcado = selecionados.has(c.id);
                      return (
                        <button type="button" key={c.id} onClick={() => alternarCliente(c.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${marcado ? 'bg-emerald-50/60' : ''}`}>
                          {marcado ? <CheckSquare size={16} className="text-emerald-600 shrink-0" /> : <Square size={16} className="text-gray-300 shrink-0" />}
                          <span className={`flex-1 truncate ${marcado ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{c.razaoSocialNome}</span>
                          {c.telefone ? <span className="text-xs text-gray-400 shrink-0">{c.telefone}</span> : <span className="text-xs text-red-400 shrink-0">sem telefone</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setModalCampanha(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={enviarCampanha} disabled={selecionados.size === 0 || !mensagem.trim()}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 ${selecionados.size > 0 && mensagem.trim() ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <MessageCircle size={16} /> Abrir WhatsApp ({selecionados.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
