import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Edit3, Loader2, MapPin, Plus, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { getSlug, tenantHeaders, authHeaders } from '../services/tenantSetup';
import { mascaraCep, buscarCep } from '../services/cep';
import { CORES_DISPONIVEIS } from '../services/cores';
import { midiaUrl } from '../utils/imageUrl';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

interface Empresa {
  id: number;
  slug: string;
  nomeEmpresa: string;
  cnpj: string | null;
  slogan: string | null;
  endereco: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  logoUrl: string | null;
  videoUrl: string | null;
  corPrincipal: string;
  ativo: boolean;
}

function mascaraCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const headersJson = () => ({
  'Content-Type': 'application/json',
  ...tenantHeaders(),
  ...authHeaders(),
});

export default function Empresas() {
  const navigate = useNavigate();
  const slug = getSlug();
  const eFocus = slug === 'focus';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(false);

  const [editando, setEditando] = useState<Empresa | null>(null);
  const [formEdicao, setFormEdicao] = useState({ nomeEmpresa: '', cnpj: '', slug: '', slogan: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', logoUrl: '', videoUrl: '', corPrincipal: '#0a0a0a', ativo: true });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [buscandoCepEdicao, setBuscandoCepEdicao] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  const carregarEmpresas = async () => {
    setCarregandoEmpresas(true);
    try {
      const response = await fetch(`${API_URL}/Configuracoes/empresas`, { headers: headersJson() });
      if (response.ok) {
        setEmpresas(await response.json());
      }
    } catch {
      // mantém lista atual
    } finally {
      setCarregandoEmpresas(false);
    }
  };

  useEffect(() => {
    if (eFocus) carregarEmpresas();
  }, [eFocus]);

  const buscarCepEditando = async () => {
    setBuscandoCepEdicao(true);
    const end = await buscarCep(formEdicao.cep);
    if (end) {
      setFormEdicao((f) => ({
        ...f,
        logradouro: end.logradouro,
        bairro: end.bairro,
        cidade: end.cidade,
        estado: end.estado,
      }));
    }
    setBuscandoCepEdicao(false);
  };

  const abrirEdicao = (emp: Empresa) => {
    setEditando(emp);
    setFormEdicao({
      nomeEmpresa: emp.nomeEmpresa,
      cnpj: emp.cnpj ?? '',
      slug: emp.slug,
      slogan: emp.slogan ?? '',
      cep: emp.cep ?? '',
      logradouro: emp.logradouro ?? '',
      numero: emp.numero ?? '',
      bairro: emp.bairro ?? '',
      cidade: emp.cidade ?? '',
      estado: emp.estado ?? '',
      logoUrl: emp.logoUrl ?? '',
      videoUrl: emp.videoUrl ?? '',
      corPrincipal: emp.corPrincipal,
      ativo: emp.ativo,
    });
    setErroEdicao('');
  };

  const uploadLogoEdicao = async (file: File | undefined) => {
    if (!file) return;
    setEnviandoLogo(true);
    setErroEdicao('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_URL}/Upload/imagem`, {
        method: 'POST',
        headers: tenantHeaders(),
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        setFormEdicao((f) => ({ ...f, logoUrl: data.url }));
      } else {
        setErroEdicao('Falha ao enviar a logo.');
      }
    } catch {
      setErroEdicao('Falha de conexão ao enviar a logo.');
    } finally {
      setEnviandoLogo(false);
    }
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      const corpo: Record<string, string | number | boolean | null> = { ...formEdicao };
      if (formEdicao.logoUrl === (editando.logoUrl ?? '')) {
        corpo.logoUrl = null;
      }

      const response = await fetch(`${API_URL}/Configuracoes/empresas/${editando.id}`, {
        method: 'PUT',
        headers: headersJson(),
        body: JSON.stringify(corpo),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErroEdicao(data?.message ?? `Erro ${response.status} ao salvar.`);
        return;
      }

      const atualizada = await response.json();
      setEmpresas((lista) => lista.map((emp) => (emp.id === atualizada.id ? atualizada : emp)));
      setEditando(null);
    } catch {
      setErroEdicao('Falha de conexão com o servidor.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  if (!eFocus) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <Building2 className="h-6 w-6 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Cadastro de empresas</h2>
          <p className="mt-2 text-sm text-gray-500">
            O cadastro de novas empresas só está disponível na plataforma da Focus.
          </p>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm';

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Empresas cadastradas</h1>
            <p className="text-sm text-gray-500">Gerencie as empresas da plataforma.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={carregarEmpresas}
            disabled={carregandoEmpresas}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${carregandoEmpresas ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => navigate(`/${slug}/empresas/nova`)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova empresa
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Empresas cadastradas</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">{empresas.length}</span>
        </div>

        <div className="overflow-x-auto">
          {carregandoEmpresas && empresas.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Carregando empresas...</div>
          ) : empresas.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Nenhuma empresa cadastrada ainda.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">Empresa</th>
                  <th className="px-6 py-3 font-semibold">CNPJ</th>
                  <th className="px-6 py-3 font-semibold">Slug</th>
                  <th className="px-6 py-3 font-semibold">Slogan</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: emp.corPrincipal || '#0a0a0a' }}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-800">{emp.nomeEmpresa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{emp.cnpj || '—'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{emp.slug}</td>
                    <td className="px-6 py-4 max-w-[220px] truncate">{emp.slogan || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${emp.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(emp)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                        title="Editar empresa"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditando(null)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Editar empresa</h2>
              <button type="button" onClick={() => setEditando(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome da empresa *</label>
                <input
                  value={formEdicao.nomeEmpresa}
                  onChange={(e) => setFormEdicao((f) => ({ ...f, nomeEmpresa: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">CNPJ</label>
                  <input
                    value={formEdicao.cnpj}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, cnpj: mascaraCnpj(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Slug (URL)</label>
                  <input
                    value={formEdicao.slug}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, slug: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cor principal</label>
                <div className="flex flex-wrap gap-2">
                  {CORES_DISPONIVEIS.map(({ cor, nome }) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormEdicao((f) => ({ ...f, corPrincipal: cor }))}
                      className={`h-9 w-9 rounded-xl transition-all hover:scale-110 ${formEdicao.corPrincipal === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: cor }}
                      title={nome}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={formEdicao.corPrincipal}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, corPrincipal: e.target.value }))}
                      className="h-9 w-9 rounded-xl cursor-pointer border border-gray-200 bg-white p-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>
                <input
                  value={formEdicao.corPrincipal}
                  onChange={(e) => setFormEdicao((f) => ({ ...f, corPrincipal: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formEdicao.logoUrl ? (
                      <img src={midiaUrl(formEdicao.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 size={28} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium transition-colors cursor-pointer shadow-sm w-fit">
                      <UploadCloud size={16} /> {enviandoLogo ? 'Enviando...' : 'Enviar Logo'}
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => uploadLogoEdicao(e.target.files?.[0])} disabled={enviandoLogo} />
                    </label>
                    {formEdicao.logoUrl && (
                      <button onClick={() => setFormEdicao((f) => ({ ...f, logoUrl: '' }))} className="text-sm text-gray-600 hover:underline flex items-center gap-1 w-fit">
                        <Trash2 size={14} /> Remover logo
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400 italic">PNG ou JPG. A logo substitui a marca exibida em todo o sistema.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slogan</label>
                <input
                  value={formEdicao.slogan}
                  onChange={(e) => setFormEdicao((f) => ({ ...f, slogan: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin size={16} className="text-gray-400" /> Endereço
                </label>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500">CEP</label>
                    <div className="flex gap-2">
                      <input
                        value={formEdicao.cep}
                        onChange={(e) => setFormEdicao((f) => ({ ...f, cep: mascaraCep(e.target.value) }))}
                        placeholder="00000-000"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={buscarCepEditando}
                        disabled={buscandoCepEdicao}
                        className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        {buscandoCepEdicao ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar CEP'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Número</label>
                    <input
                      value={formEdicao.numero}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, numero: e.target.value }))}
                      placeholder="123"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Estado (UF)</label>
                    <input
                      value={formEdicao.estado}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, estado: e.target.value }))}
                      maxLength={2}
                      placeholder="PE"
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Logradouro</label>
                    <input
                      value={formEdicao.logradouro}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, logradouro: e.target.value }))}
                      placeholder="Rua, avenida..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Bairro</label>
                    <input
                      value={formEdicao.bairro}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, bairro: e.target.value }))}
                      placeholder="Centro"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Cidade</label>
                    <input
                      value={formEdicao.cidade}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, cidade: e.target.value }))}
                      placeholder="Paulista"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Vídeo / Foto de Fundo (login)</label>
                <input
                  value={formEdicao.videoUrl}
                  onChange={(e) => setFormEdicao((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="URL do vídeo (mp4/webm) ou foto (png/jpg)"
                  className={inputCls}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formEdicao.ativo}
                  onChange={(e) => setFormEdicao((f) => ({ ...f, ativo: e.target.checked }))}
                  className="h-4 w-4"
                />
                Empresa ativa
              </label>

              {erroEdicao && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-600">{erroEdicao}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarEdicao}
                  disabled={salvandoEdicao || !formEdicao.nomeEmpresa.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {salvandoEdicao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
