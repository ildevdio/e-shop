import { useState, useEffect } from 'react';
import { Plus, X, Phone, Pencil, Trash2, Loader2 } from 'lucide-react';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clienteService, type Cliente, type CriarClienteDto } from '../services/clienteService';
import { useUiStore } from '../store/uiStore';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

const camposVazios: CriarClienteDto = {
  razaoSocialNome: '', nomeFantasia: '', cpfCnpj: '', tipoPessoa: 'PJ', inscricaoEstadual: '', inscricaoMunicipal: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '', regimeTributario: '',
};

export default function ComercialClientes() {
  const { setModalAberto } = useUiStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [modalTipo, setModalTipo] = useState<'criar' | 'editar' | 'detalhe' | null>(null);
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState<CriarClienteDto>(camposVazios);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);

  useEffect(() => { carregarClientes(); }, []);

  const carregarClientes = async () => {
    const data = await clienteService.getClientes();
    setClientes(data);
  };

  const abrirCriar = () => {
    setForm(camposVazios);
    setSelecionado(null);
    setModalTipo('criar');
    setModalAberto(true);
  };

  const abrirEditar = (c: Cliente) => {
    setForm({
      razaoSocialNome: c.razaoSocialNome, nomeFantasia: c.nomeFantasia, cpfCnpj: c.cpfCnpj,
      tipoPessoa: c.tipoPessoa || 'PJ',
      inscricaoEstadual: c.inscricaoEstadual, inscricaoMunicipal: c.inscricaoMunicipal,
      cep: c.cep, logradouro: c.logradouro, numero: c.numero, complemento: c.complemento,
      bairro: c.bairro, cidade: c.cidade, estado: c.estado,
      telefone: c.telefone, email: c.email, regimeTributario: c.regimeTributario,
    });
    setSelecionado(c);
    setModalTipo('editar');
    setModalAberto(true);
  };

  const abrirDetalhe = (c: Cliente) => {
    setSelecionado(c);
    setModalTipo('detalhe');
    setModalAberto(true);
  };

  const fecharModal = () => { setModalTipo(null); setSelecionado(null); setModalAberto(false); };

  const salvar = async () => {
    if (!form.razaoSocialNome.trim() || !form.cpfCnpj.trim()) return;
    setSalvando(true);
    try {
      if (modalTipo === 'criar') {
        await clienteService.criarCliente(form);
      } else if (modalTipo === 'editar' && selecionado) {
        await clienteService.atualizarCliente(selecionado.id, form);
      }
      await carregarClientes();
      fecharModal();
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: number) => {
    if (!confirm('Deseja excluir este cliente?')) return;
    await clienteService.deletarCliente(id);
    await carregarClientes();
    fecharModal();
  };

  const filtrados = clientes.filter(c =>
    c.razaoSocialNome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpfCnpj.includes(busca) ||
    c.cidade.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  const setCampo = (campo: keyof CriarClienteDto, valor: string) => setForm(f => ({ ...f, [campo]: valor }));

  const buscarCNPJ = async () => {
    const cnpj = form.cpfCnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return;
    setBuscandoCNPJ(true);
    try {
      const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'ERROR') return;
      setForm(f => ({
        ...f,
        razaoSocialNome: data.nome || f.razaoSocialNome,
        nomeFantasia: data.fantasia || f.nomeFantasia,
        telefone: data.telefone || f.telefone,
        email: data.email || f.email,
        logradouro: data.logradouro || f.logradouro,
        numero: data.numero || f.numero,
        complemento: data.complemento || f.complemento,
        bairro: data.bairro || f.bairro,
        cidade: data.municipio || f.cidade,
        estado: data.uf || f.estado,
        cep: data.cep || f.cep,
      }));
    } catch {
      // CNPJ não encontrado, ignora
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const buscarCEP = async () => {
    const cep = (form.cep ?? '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    setBuscandoCEP(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      if (!res.ok) return;
      const data = await res.json();
      setForm(f => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        complemento: data.complemento || f.complemento,
        bairro: data.bairro || f.bairro,
        cidade: data.city || f.cidade,
        estado: data.state || f.estado,
      }));
    } catch {
      // CEP não encontrado, ignora
    } finally {
      setBuscandoCEP(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const renderFormulario = () => {
    const isPJ = form.tipoPessoa === 'PJ';
    return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>{isPJ ? 'Razão Social' : 'Nome Completo'} *</label>
          <input type="text" value={form.razaoSocialNome} onChange={e => setCampo('razaoSocialNome', e.target.value)} className={inputClass} placeholder={isPJ ? 'Razão social...' : 'Nome completo...'} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Tipo de Pessoa</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForm(f => ({ ...f, tipoPessoa: 'PJ', cpfCnpj: '' })); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipoPessoa === 'PJ' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              Pessoa Jurídica (CNPJ)
            </button>
            <button type="button" onClick={() => { setForm(f => ({ ...f, tipoPessoa: 'PF', cpfCnpj: '' })); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${form.tipoPessoa === 'PF' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              Pessoa Física (CPF)
            </button>
          </div>
        </div>
        {isPJ && (
          <div>
            <label className={labelClass}>Nome Fantasia</label>
            <input type="text" value={form.nomeFantasia} onChange={e => setCampo('nomeFantasia', e.target.value)} className={inputClass} placeholder="Nome fantasia..." />
          </div>
        )}
        <div>
          <label className={labelClass}>{isPJ ? 'CNPJ' : 'CPF'} *</label>
          <div className="relative">
            <input type="text" value={form.cpfCnpj} onChange={e => setCampo('cpfCnpj', e.target.value)}
              onBlur={isPJ ? buscarCNPJ : undefined}
              className={`${inputClass} ${buscandoCNPJ ? 'pr-9' : ''}`}
              placeholder={isPJ ? '00.000.000/0001-00' : '000.000.000-00'} />
            {buscandoCNPJ && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
          </div>
        </div>
        {isPJ && (
          <>
            <div>
              <label className={labelClass}>Inscrição Estadual</label>
              <input type="text" value={form.inscricaoEstadual} onChange={e => setCampo('inscricaoEstadual', e.target.value)} className={inputClass} placeholder="IE..." />
            </div>
            <div>
              <label className={labelClass}>Inscrição Municipal</label>
              <input type="text" value={form.inscricaoMunicipal} onChange={e => setCampo('inscricaoMunicipal', e.target.value)} className={inputClass} placeholder="IM..." />
            </div>
            <div>
              <label className={labelClass}>Regime Tributário</label>
              <select value={form.regimeTributario} onChange={e => setCampo('regimeTributario', e.target.value)} className={inputClass}>
                <option value="">Selecione...</option>
                {REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </>
        )}
        <div>
          <label className={labelClass}>Telefone</label>
          <input type="text" value={form.telefone} onChange={e => setCampo('telefone', e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>E-mail</label>
          <input type="email" value={form.email} onChange={e => setCampo('email', e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
        </div>
      </div>
      <hr className="border-gray-100" />
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Endereço</p>
      <div className="grid grid-cols-6 gap-4">
        <div>
          <label className={labelClass}>CEP</label>
          <div className="relative">
            <input type="text" value={form.cep} onChange={e => setCampo('cep', e.target.value)}
              onBlur={buscarCEP}
              className={`${inputClass} ${buscandoCEP ? 'pr-9' : ''}`}
              placeholder="00000-000" />
            {buscandoCEP && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
          </div>
        </div>
        <div className="col-span-3">
          <label className={labelClass}>Logradouro</label>
          <input type="text" value={form.logradouro} onChange={e => setCampo('logradouro', e.target.value)} className={inputClass} placeholder="Rua, Av..." />
        </div>
        <div>
          <label className={labelClass}>Número</label>
          <input type="text" value={form.numero} onChange={e => setCampo('numero', e.target.value)} className={inputClass} placeholder="Nº" />
        </div>
        <div>
          <label className={labelClass}>Compl.</label>
          <input type="text" value={form.complemento} onChange={e => setCampo('complemento', e.target.value)} className={inputClass} placeholder="Compl..." />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Bairro</label>
          <input type="text" value={form.bairro} onChange={e => setCampo('bairro', e.target.value)} className={inputClass} placeholder="Bairro..." />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Cidade</label>
          <input type="text" value={form.cidade} onChange={e => setCampo('cidade', e.target.value)} className={inputClass} placeholder="Cidade..." />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Estado</label>
          <select value={form.estado} onChange={e => setCampo('estado', e.target.value)} className={inputClass}>
            <option value="">UF</option>
            {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>
    </div>
    );
  };

  const renderDetalhe = () => {
    if (!selecionado) return null;
    const campo = (label: string, valor?: string) => (
      <div className="bg-gray-50 rounded-xl p-3">
        <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
        <p className="text-gray-900 font-medium mt-0.5">{valor || '—'}</p>
      </div>
    );
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {campo('Tipo', selecionado.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica')}
          {campo(selecionado.tipoPessoa === 'PF' ? 'Nome' : 'Razão Social', selecionado.razaoSocialNome)}
          {selecionado.tipoPessoa === 'PJ' && campo('Nome Fantasia', selecionado.nomeFantasia)}
          {campo(selecionado.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ', selecionado.cpfCnpj)}
          {selecionado.tipoPessoa === 'PJ' && campo('Inscrição Estadual', selecionado.inscricaoEstadual)}
          {selecionado.tipoPessoa === 'PJ' && campo('Inscrição Municipal', selecionado.inscricaoMunicipal)}
          {selecionado.tipoPessoa === 'PJ' && campo('Regime Tributário', selecionado.regimeTributario)}
          {campo('Telefone', selecionado.telefone)}
          {campo('E-mail', selecionado.email)}
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4">Endereço</p>
        <div className="grid grid-cols-2 gap-3">
          {campo('CEP', selecionado.cep)}
          {campo('Logradouro', `${selecionado.logradouro}${selecionado.numero ? ', ' + selecionado.numero : ''}`)}
          {campo('Complemento', selecionado.complemento)}
          {campo('Bairro', selecionado.bairro)}
          {campo('Cidade', selecionado.cidade)}
          {campo('Estado', selecionado.estado)}
        </div>
        {selecionado.contatos && selecionado.contatos.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4">Contatos Vinculados</p>
            <div className="space-y-2">
              {selecionado.contatos.map(ct => (
                <div key={ct.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span className="text-gray-900 font-medium text-sm">{ct.nome}</span>
                  <span className="text-gray-500 text-sm">{ct.telefone}</span>
                  {ct.email && <span className="text-gray-400 text-xs ml-auto">{ct.email}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/comercial" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Cadastro e gestão de clientes do setor comercial.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <SearchAutocomplete
            placeholder="Buscar cliente..."
            valor={busca}
            onChange={setBusca}
            sugestoes={clientes.map(c => ({ rotulo: c.razaoSocialNome, subRotulo: c.cpfCnpj ?? c.cidade ?? '' }))}
            aoSelecionar={(s) => setBusca(s.rotulo)}
            className="flex-1 min-w-0"
          />
          <button onClick={abrirCriar} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Cliente
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Razão Social</th>
                <th className="px-6 py-3 font-semibold">CNPJ/CPF</th>
                <th className="px-6 py-3 font-semibold">Cidade</th>
                <th className="px-6 py-3 font-semibold">Telefone</th>
                <th className="px-6 py-3 font-semibold">Contatos</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum cliente encontrado.</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id} onDoubleClick={() => abrirDetalhe(c)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.razaoSocialNome}</td>
                  <td className="px-6 py-4">{c.cpfCnpj}</td>
                  <td className="px-6 py-4">{c.cidade || '—'}</td>
                  <td className="px-6 py-4">{c.telefone || '—'}</td>
                  <td className="px-6 py-4">
                    {c.contatos && c.contatos.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.contatos.map(ct => (
                          <span key={ct.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg">
                            <Phone size={10} /> {ct.nome}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); abrirEditar(c); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletar(c.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Excluir">
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
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {modalTipo === 'criar' ? 'Novo Cliente' : modalTipo === 'editar' ? 'Editar Cliente' : 'Detalhes do Cliente'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            {modalTipo === 'detalhe' ? renderDetalhe() : renderFormulario()}

            {modalTipo !== 'detalhe' && (
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={fecharModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
                <button onClick={salvar} disabled={!form.razaoSocialNome.trim() || !form.cpfCnpj.trim() || salvando}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.razaoSocialNome.trim() && form.cpfCnpj.trim() && !salvando ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {salvando ? 'Salvando...' : modalTipo === 'criar' ? 'Cadastrar Cliente' : 'Salvar Alterações'}
                </button>
              </div>
            )}
            {modalTipo === 'detalhe' && (
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={() => { const c = selecionado; fecharModal(); if (c) abrirEditar(c); }} className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl font-medium transition-colors text-sm flex items-center gap-2">
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
