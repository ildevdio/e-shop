import { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader2, Star, Phone, Globe, ExternalLink, Plus, X, Download, Trash2, ChevronDown, Building2 } from 'lucide-react';
import { useSistemaStore } from '../store/sistemaStore';
import { prospeccaoService, type EmpresaEncontrada, type Prospect, type ResultadoBusca, type CategoriaPredefinida } from '../services/prospeccaoService';
import { useUiStore } from '../store/uiStore';
import SearchModal from '../components/SearchModal';

type Aba = 'buscar' | 'salvos';

const STATUS_PROSPECT = ['Novo', 'Contato', 'Interessado', 'Convertido', 'Descartado'];
const STATUS_CORES: Record<string, string> = {
  Novo: 'bg-blue-100 text-blue-700',
  Contato: 'bg-yellow-100 text-yellow-700',
  Interessado: 'bg-purple-100 text-purple-700',
  Convertido: 'bg-green-100 text-green-700',
  Descartado: 'bg-gray-100 text-gray-500',
};

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface EnderecoForm {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const enderecoVazio: EnderecoForm = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' };

export default function ComercialProspeccao() {
  const config = useSistemaStore(s => s.config);
  const { setModalAberto } = useUiStore();

  const [aba, setAba] = useState<Aba>('buscar');
  const [endereco, setEndereco] = useState<EnderecoForm>(enderecoVazio);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [raioKm, setRaioKm] = useState(5);
  const [limite, setLimite] = useState(20);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(['supermarket']);
  const [categoriasPredefinidas, setCategoriasPredefinidas] = useState<CategoriaPredefinida[]>([]);
  const [customCategoria, setCustomCategoria] = useState('');

  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [proximosResultados, setProximosResultados] = useState<EmpresaEncontrada[]>([]);
  const [proximoToken, setProximoToken] = useState<string | null>(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [carregandoProspects, setCarregandoProspects] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [buscaProspect, setBuscaProspect] = useState('');
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const [detalheProspect, setDetalheProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    prospeccaoService.getCategoriasPredefinidas().then(setCategoriasPredefinidas);
  }, []);

  const buscarCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setBuscandoCEP(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
      if (resp.ok) {
        const data = await resp.json();
        setEndereco(prev => ({
          ...prev,
          logradouro: data.street ?? prev.logradouro,
          bairro: data.neighborhood ?? prev.bairro,
          cidade: data.city ?? prev.cidade,
          estado: data.state ?? prev.estado,
        }));
      }
    } catch {
      // ignora erro
    } finally {
      setBuscandoCEP(false);
    }
  };

  const enderecoCompoe = (): string => {
    const partes = [endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado].filter(Boolean);
    return partes.join(', ');
  };

  const carregarProspects = useCallback(async () => {
    setCarregandoProspects(true);
    const data = await prospeccaoService.getProspects(filtroStatus, buscaProspect);
    setProspects(data);
    setCarregandoProspects(false);
  }, [filtroStatus, buscaProspect]);

  useEffect(() => {
    if (aba === 'salvos') carregarProspects();
  }, [aba, carregarProspects]);

  const toggleCategoria = (valor: string) => {
    setCategoriasSelecionadas(prev =>
      prev.includes(valor) ? prev.filter(c => c !== valor) : [...prev, valor]
    );
  };

  const adicionarCategoriaCustom = () => {
    const val = customCategoria.trim().toLowerCase().replace(/\s+/g, '_');
    if (val && !categoriasSelecionadas.includes(val)) {
      setCategoriasSelecionadas(prev => [...prev, val]);
      setCustomCategoria('');
    }
  };

  const buscar = async (token?: string) => {
    if (!config.googleMapsApiKey) {
      alert('Configure a chave da API do Google Maps em Configurações > Sistema antes de buscar.');
      return;
    }
    const enderecoComposto = enderecoCompoe();
    if (!enderecoComposto.trim() && categoriasSelecionadas.length === 0) return;

    if (token) {
      setCarregandoMais(true);
    } else {
      setBuscando(true);
      setErroBusca(null);
      setProximosResultados([]);
      setProximoToken(null);
    }

    const resultado = await prospeccaoService.buscar({
      enderecoOuCidade: enderecoComposto,
      raioKm,
      categorias: categoriasSelecionadas,
      limite,
      proximoToken: token,
    }).catch((e: Error) => {
      setErroBusca(e.message);
      setBuscando(false);
      setCarregandoMais(false);
      return null;
    });

    if (resultado) {
      if (token) {
        setProximosResultados(prev => [...prev, ...resultado.resultados]);
      } else {
        setResultado(resultado);
        setProximosResultados([]);
      }
      setProximoToken(resultado.proximoToken ?? null);
      setErroBusca(null);
    }

    setBuscando(false);
    setCarregandoMais(false);
  };

  const carregarMais = () => {
    if (proximoToken) buscar(proximoToken);
  };

  const todosResultados = [...(resultado?.resultados ?? []), ...proximosResultados];

  const salvarProspect = async (empresa: EmpresaEncontrada) => {
    const key = empresa.placeId || empresa.nome;
    setSalvandoId(key);
    await prospeccaoService.salvarProspect({
      nomeEmpresa: empresa.nome,
      enderecoCompleto: empresa.endereco,
      telefone: empresa.telefone ?? '',
      latitude: empresa.latitude,
      longitude: empresa.longitude,
      site: empresa.site,
      categoria: empresa.categoria ?? '',
      placeId: empresa.placeId,
      rating: empresa.avaliacao,
      totalAvaliacoes: empresa.totalAvaliacoes,
    });
    setSalvandoId(null);
  };

  const excluirProspect = async (id: number) => {
    if (!confirm('Deseja excluir este prospect?')) return;
    await prospeccaoService.deletarProspect(id);
    setProspects(prev => prev.filter(p => p.id !== id));
    if (detalheProspect?.id === id) setDetalheProspect(null);
  };

  const atualizarStatus = async (id: number, status: string) => {
    await prospeccaoService.atualizarProspect(id, { status });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (detalheProspect?.id === id) setDetalheProspect(prev => prev ? { ...prev, status } : null);
  };

  const exportarCsv = () => {
    const header = 'Nome,Endereço,Bairro,Cidade,Estado,Telefone,Email,Categoria,Status,Avaliação,Observações\n';
    const rows = prospects.map(p =>
      [
        `"${p.nomeEmpresa}"`,
        `"${p.enderecoCompleto}"`,
        `"${p.bairro}"`,
        `"${p.cidade}"`,
        `"${p.estado}"`,
        `"${p.telefone}"`,
        `"${p.email}"`,
        `"${p.categoria}"`,
        `"${p.status}"`,
        p.rating?.toFixed(1) ?? '',
        `"${(p.observacoes ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config.googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center max-w-md shadow-sm">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-heading font-semibold text-gray-800 mb-2">Prospecção via Google Maps</h2>
          <p className="text-sm text-gray-500 mb-6">
            Para usar a busca de prospects, configure a chave da API do Google Maps em{' '}
            <strong>Configurações &gt; Sistema &gt; Prospecção</strong>.
          </p>
          <p className="text-xs text-gray-400">
            Você precisa de uma conta no Google Cloud Console com a Places API habilitada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MapPin size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-semibold text-gray-900">Prospecção</h1>
              <p className="text-xs text-gray-500">Busque empresas potenciais no Google Maps</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAba('buscar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aba === 'buscar' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search size={14} className="inline mr-1.5" />
              Buscar
            </button>
            <button
              onClick={() => setAba('salvos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aba === 'salvos' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building2 size={14} className="inline mr-1.5" />
              Salvos ({prospects.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {aba === 'buscar' ? (
          <div className="flex flex-col lg:flex-row h-full">
            {/* Painel de busca */}
            <div className="w-full lg:w-80 shrink-0 border-r border-gray-200 bg-gray-50 p-5 overflow-y-auto">
              <div className="space-y-5">
                {/* Endereço */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={endereco.cep}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setEndereco(prev => ({ ...prev, cep: val }));
                      }}
                      onBlur={() => buscarCEP(endereco.cep)}
                      onKeyDown={e => e.key === 'Enter' && buscarCEP(endereco.cep)}
                      maxLength={8}
                      placeholder="00000-000"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    {buscandoCEP && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    value={endereco.logradouro}
                    onChange={e => setEndereco(prev => ({ ...prev, logradouro: e.target.value }))}
                    placeholder="Rua, Avenida..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Número
                    </label>
                    <input
                      type="text"
                      value={endereco.numero}
                      onChange={e => setEndereco(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="Nº"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={endereco.bairro}
                      onChange={e => setEndereco(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Bairro"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={endereco.cidade}
                      onChange={e => setEndereco(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="Cidade"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      UF
                    </label>
                    <select
                      value={endereco.estado}
                      onChange={e => setEndereco(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">UF</option>
                      {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>

                {/* Raio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Raio: {raioKm} km
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={raioKm}
                    onChange={e => setRaioKm(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {/* Limite */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Limite de empresas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={limite}
                    onChange={e => setLimite(Math.min(60, Math.max(1, Number(e.target.value))))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Categorias */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Categorias
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {categoriasPredefinidas.map(cat => (
                      <button
                        key={cat.valor}
                        onClick={() => toggleCategoria(cat.valor)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          categoriasSelecionadas.includes(cat.valor)
                            ? 'bg-primary text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {cat.nome}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <input
                      type="text"
                      value={customCategoria}
                      onChange={e => setCustomCategoria(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && adicionarCategoriaCustom()}
                      placeholder="Categoria customizada"
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button
                      onClick={adicionarCategoriaCustom}
                      className="rounded-lg bg-gray-200 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  {categoriasSelecionadas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {categoriasSelecionadas.map(c => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {c}
                          <button onClick={() => toggleCategoria(c)} className="hover:text-red-500">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buscar */}
                <button
                  onClick={() => buscar()}
                  disabled={buscando || categoriasSelecionadas.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {buscando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Buscar Empresas
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto p-5">
              {erroBusca && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erroBusca}
                </div>
              )}
              {todosResultados.length === 0 && !buscando ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MapPin size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">Configure os filtros e clique em "Buscar Empresas"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">
                      {todosResultados.length} empresa(s) encontrada(s)
                    </p>
                  </div>

                  {todosResultados.map((empresa, idx) => (
                    <EmpresaCard
                      key={`${empresa.placeId || empresa.nome}-${idx}`}
                      empresa={empresa}
                      salvando={salvandoId === (empresa.placeId || empresa.nome)}
                      onSalvar={() => salvarProspect(empresa)}
                    />
                  ))}

                  {proximoToken && (
                    <button
                      onClick={carregarMais}
                      disabled={carregandoMais}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      {carregandoMais ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Carregando mais...
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Carregar mais resultados
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Aba Salvos */
          <div className="p-5">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <SearchModal placeholder="Buscar prospects..." valor={buscaProspect} onChange={setBuscaProspect} />
              <div className="flex gap-1.5">
                {['Todos', ...STATUS_PROSPECT].map(s => (
                  <button
                    key={s}
                    onClick={() => setFiltroStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filtroStatus === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={exportarCsv}
                disabled={prospects.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <Download size={14} />
                Exportar CSV
              </button>
            </div>

            {/* Lista */}
            {carregandoProspects ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : prospects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Building2 size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Nenhum prospect salvo ainda</p>
                <p className="text-xs mt-1">Use a aba "Buscar" para encontrar empresas</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {prospects.map(p => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setDetalheProspect(p); setModalAberto(true); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{p.nomeEmpresa}</h3>
                        <p className="text-xs text-gray-500 truncate">{p.enderecoCompleto}</p>
                      </div>
                      <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CORES[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {p.categoria && <span className="truncate">{p.categoria}</span>}
                      {p.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                      {p.telefone && <Phone size={10} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalhe prospect */}
      {detalheProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setDetalheProspect(null); setModalAberto(false); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-heading font-semibold text-gray-900">{detalheProspect.nomeEmpresa}</h2>
              <button onClick={() => { setDetalheProspect(null); setModalAberto(false); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                <div className="flex gap-1.5 mt-1.5">
                  {STATUS_PROSPECT.map(s => (
                    <button
                      key={s}
                      onClick={() => atualizarStatus(detalheProspect.id, s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        detalheProspect.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400">Categoria</span>
                  <p className="text-gray-700">{detalheProspect.categoria || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Avaliação</span>
                  <p className="text-gray-700 flex items-center gap-1">
                    {detalheProspect.rating ? (
                      <>
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {detalheProspect.rating.toFixed(1)} ({detalheProspect.totalAvaliacoes} avaliações)
                      </>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-400">Endereço</span>
                  <p className="text-gray-700">{detalheProspect.enderecoCompleto || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Telefone</span>
                  <p className="text-gray-700">{detalheProspect.telefone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">E-mail</span>
                  <p className="text-gray-700">{detalheProspect.email || '-'}</p>
                </div>
                {detalheProspect.site && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400">Site</span>
                    <p className="text-gray-700 flex items-center gap-1">
                      <Globe size={12} />
                      <a href={detalheProspect.site} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {detalheProspect.site}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Observações</label>
                <textarea
                  value={detalheProspect.observacoes ?? ''}
                  onChange={e => setDetalheProspect(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                  onBlur={() => {
                    if (detalheProspect) {
                      prospeccaoService.atualizarProspect(detalheProspect.id, { observacoes: detalheProspect.observacoes ?? '' });
                      setProspects(prev => prev.map(p => p.id === detalheProspect.id ? { ...p, observacoes: detalheProspect.observacoes } : p));
                    }
                  }}
                  placeholder="Adicione observações sobre este prospect..."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { excluirProspect(detalheProspect.id); setModalAberto(false); }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
                {detalheProspect.latitude && detalheProspect.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${detalheProspect.latitude},${detalheProspect.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <ExternalLink size={12} />
                    Abrir no Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmpresaCard({ empresa, salvando, onSalvar }: {
  empresa: EmpresaEncontrada;
  salvando: boolean;
  onSalvar: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm">{empresa.nome}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{empresa.endereco}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {empresa.categoria && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {empresa.categoria}
              </span>
            )}
            {empresa.avaliacao && (
              <span className="flex items-center gap-0.5">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                {empresa.avaliacao.toFixed(1)}
                {empresa.totalAvaliacoes && <span className="text-gray-300">({empresa.totalAvaliacoes})</span>}
              </span>
            )}
            {empresa.abertoAgora && (
              <span className="text-green-500 font-medium">Aberto agora</span>
            )}
          </div>
        </div>
        <button
          onClick={onSalvar}
          disabled={salvando}
          className="shrink-0 ml-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {salvando ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}
