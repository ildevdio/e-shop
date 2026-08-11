import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Phone, X, Pencil, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlug } from '../services/tenantSetup';
import { contatoService, type Contato, type CriarContatoDto } from '../services/contatoService';
import { clienteService, type Cliente } from '../services/clienteService';
import { useUiStore } from '../store/uiStore';

const camposVazios: CriarContatoDto = { nome: '', telefone: '', email: '', cargo: '', clienteId: null };

export default function ComercialContatos() {
  const { setModalAberto } = useUiStore();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [modalTipo, setModalTipo] = useState<'criar' | 'editar' | 'detalhe' | null>(null);
  const [selecionado, setSelecionado] = useState<Contato | null>(null);
  const [form, setForm] = useState<CriarContatoDto>(camposVazios);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    const [c, cl] = await Promise.all([contatoService.getContatos(), clienteService.getClientes()]);
    setContatos(c);
    setClientes(cl);
  };

  const abrirCriar = () => { setForm(camposVazios); setSelecionado(null); setModalTipo('criar'); setModalAberto(true); };

  const abrirEditar = (c: Contato) => {
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email, cargo: c.cargo, clienteId: c.clienteId });
    setSelecionado(c);
    setModalTipo('editar');
    setModalAberto(true);
  };

  const abrirDetalhe = (c: Contato) => { setSelecionado(c); setModalTipo('detalhe'); setModalAberto(true); };

  const fecharModal = () => { setModalTipo(null); setSelecionado(null); setModalAberto(false); };

  const salvar = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) return;
    setSalvando(true);
    try {
      if (modalTipo === 'criar') {
        await contatoService.criarContato(form);
      } else if (modalTipo === 'editar' && selecionado) {
        await contatoService.atualizarContato(selecionado.id, form);
      }
      await carregarDados();
      fecharModal();
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: number) => {
    if (!confirm('Deseja excluir este contato?')) return;
    await contatoService.deletarContato(id);
    await carregarDados();
    fecharModal();
  };

  const filtrados = contatos.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase()) ||
    (c.clienteNome && c.clienteNome.toLowerCase().includes(busca.toLowerCase()))
  );

  const setCampo = (campo: keyof CriarContatoDto, valor: string | number | null) => setForm(f => ({ ...f, [campo]: valor }));

  const inputClass = "w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const renderFormulario = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nome *</label>
        <input type="text" value={form.nome} onChange={e => setCampo('nome', e.target.value)} className={inputClass} placeholder="Nome do contato..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Telefone *</label>
          <input type="text" value={form.telefone} onChange={e => setCampo('telefone', e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input type="email" value={form.email} onChange={e => setCampo('email', e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cargo</label>
          <input type="text" value={form.cargo} onChange={e => setCampo('cargo', e.target.value)} className={inputClass} placeholder="Ex: Comprador" />
        </div>
        <div>
          <label className={labelClass}>Cliente Vinculado</label>
          <select value={form.clienteId ?? ''} onChange={e => setCampo('clienteId', e.target.value ? Number(e.target.value) : null)} className={inputClass}>
            <option value="">Nenhum</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.razaoSocialNome}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderDetalhe = () => {
    if (!selecionado) return null;
    const campo = (label: string, valor?: string) => (
      <div className="bg-gray-50 rounded-xl p-3">
        <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
        <p className="text-gray-900 font-medium mt-0.5">{valor || '—'}</p>
      </div>
    );
    return (
      <div className="grid grid-cols-2 gap-3">
        {campo('Nome', selecionado.nome)}
        {campo('Telefone', selecionado.telefone)}
        {campo('E-mail', selecionado.email)}
        {campo('Cargo', selecionado.cargo)}
        {campo('Cliente Vinculado', selecionado.clienteNome)}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to={`/${getSlug()}/comercial`} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-500 mt-1">Lista de contatos dos clientes cadastrados.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar contato ou cliente..." value={busca} onChange={e => setBusca(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm flex-1 min-w-0 transition-all" />
          </div>
          <button onClick={abrirCriar} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Contato
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Nome</th>
                <th className="px-6 py-3 font-semibold">Telefone</th>
                <th className="px-6 py-3 font-semibold">E-mail</th>
                <th className="px-6 py-3 font-semibold">Cargo</th>
                <th className="px-6 py-3 font-semibold">Cliente Vinculado</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum contato encontrado.</td></tr>
              ) : filtrados.map(ct => (
                <tr key={ct.id} onDoubleClick={() => abrirDetalhe(ct)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900">{ct.nome}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {ct.telefone}</span>
                  </td>
                  <td className="px-6 py-4">{ct.email || '—'}</td>
                  <td className="px-6 py-4">{ct.cargo || '—'}</td>
                  <td className="px-6 py-4 text-gray-400">{ct.clienteNome || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); abrirEditar(ct); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletar(ct.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalTipo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={fecharModal}>
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {modalTipo === 'criar' ? 'Novo Contato' : modalTipo === 'editar' ? 'Editar Contato' : 'Detalhes do Contato'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            {modalTipo === 'detalhe' ? renderDetalhe() : renderFormulario()}

            {modalTipo !== 'detalhe' && (
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={fecharModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
                <button onClick={salvar} disabled={!form.nome.trim() || !form.telefone.trim() || salvando}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.nome.trim() && form.telefone.trim() && !salvando ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {salvando ? 'Salvando...' : modalTipo === 'criar' ? 'Cadastrar Contato' : 'Salvar Alterações'}
                </button>
              </div>
            )}
            {modalTipo === 'detalhe' && (
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={() => { const c = selecionado; fecharModal(); if (c) abrirEditar(c); }} className="px-5 py-2.5 bg-primary text-white hover:bg-primary rounded-xl font-medium transition-colors text-sm flex items-center gap-2">
                  <Pencil size={14} /> Editar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
