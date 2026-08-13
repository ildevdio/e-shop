import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Copy, Link2, Loader2, MapPin, Trash2, UploadCloud } from 'lucide-react';
import { getSlug, tenantHeaders, authHeaders } from '../services/tenantSetup';
import { mascaraCep, buscarCep } from '../services/cep';
import { CORES_DISPONIVEIS } from '../services/cores';
import { midiaUrl } from '../utils/imageUrl';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

interface EmpresaCriada {
  id: number;
  slug: string;
  nomeEmpresa: string;
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

export default function NovaEmpresa() {
  const navigate = useNavigate();
  const slug = getSlug();
  const eFocus = slug === 'focus';

  const [form, setForm] = useState({
    nomeEmpresa: '',
    cnpj: '',
    slogan: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    logoUrl: '',
    videoUrl: '',
    corPrincipal: '#0a0a0a',
    login: 'admin',
    senha: 'admin123',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState('');
  const [criada, setCriada] = useState<EmpresaCriada | null>(null);
  const [copiado, setCopiado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErro('');
  };

  const copiar = (valor: string, chave: string) => {
    navigator.clipboard.writeText(valor).then(() => {
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 1500);
    });
  };

  const buscarCepNovo = async () => {
    setBuscandoCep(true);
    const end = await buscarCep(form.cep);
    if (end) {
      setForm((f) => ({
        ...f,
        logradouro: end.logradouro,
        bairro: end.bairro,
        cidade: end.cidade,
        estado: end.estado,
      }));
    }
    setBuscandoCep(false);
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    setCriada(null);

    try {
      const response = await fetch(`${API_URL}/Configuracoes`, {
        method: 'POST',
        headers: headersJson(),
        body: JSON.stringify({
          nomeEmpresa: form.nomeEmpresa,
          cnpj: form.cnpj,
          slogan: form.slogan,
          cep: form.cep,
          logradouro: form.logradouro,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          logoUrl: form.logoUrl,
          videoUrl: form.videoUrl,
          corPrincipal: form.corPrincipal,
          login: form.login,
          senha: form.senha,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErro(data?.message ?? `Erro ${response.status} ao cadastrar.`);
        return;
      }

      const data = await response.json();
      setCriada(data);
      setForm({ nomeEmpresa: '', cnpj: '', slogan: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', logoUrl: '', videoUrl: '', corPrincipal: '#0a0a0a', login: 'admin', senha: 'admin123' });
    } catch {
      setErro('Falha de conexão com o servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setEnviandoLogo(true);
    setErro('');
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
        setForm((f) => ({ ...f, logoUrl: data.url }));
      } else {
        setErro('Falha ao enviar a logo.');
      }
    } catch {
      setErro('Falha de conexão ao enviar a logo.');
    } finally {
      setEnviandoLogo(false);
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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/${slug}/empresas`)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
            title="Voltar para empresas"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Nova Empresa</h1>
              <p className="text-sm text-gray-500">Preencha os dados para criar uma nova empresa.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={cadastrar} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome da empresa *</label>
            <input value={form.nomeEmpresa} onChange={set('nomeEmpresa')} required placeholder="Ex.: Grãos do Sertão" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CNPJ *</label>
            <input
              value={form.cnpj}
              onChange={(e) => { setForm((f) => ({ ...f, cnpj: mascaraCnpj(e.target.value) })); setErro(''); }}
              placeholder="00.000.000/0000-00"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slogan</label>
          <input value={form.slogan} onChange={set('slogan')} placeholder="Ex.: Qualidade em amendoim" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {form.logoUrl ? (
                <img src={midiaUrl(form.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={28} className="text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium transition-colors cursor-pointer shadow-sm w-fit">
                <UploadCloud size={16} /> {enviandoLogo ? 'Enviando...' : 'Enviar Logo'}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} disabled={enviandoLogo} />
              </label>
              {form.logoUrl && (
                <button onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))} className="text-sm text-gray-600 hover:underline flex items-center gap-1 w-fit">
                  <Trash2 size={14} /> Remover logo
                </button>
              )}
              <p className="text-[11px] text-gray-400 italic">PNG ou JPG. A logo substitui a marca exibida em todo o sistema.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin size={16} className="text-gray-400" /> Endereço
          </label>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">CEP</label>
              <div className="flex gap-2">
                <input
                  value={form.cep}
                  onChange={(e) => setForm((f) => ({ ...f, cep: mascaraCep(e.target.value) }))}
                  placeholder="00000-000"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={buscarCepNovo}
                  disabled={buscandoCep}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar CEP'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Número</label>
              <input value={form.numero} onChange={set('numero')} placeholder="123" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Estado (UF)</label>
              <input value={form.estado} onChange={set('estado')} maxLength={2} placeholder="PE" className={inputCls} />
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Logradouro</label>
              <input value={form.logradouro} onChange={set('logradouro')} placeholder="Rua, avenida..." className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Bairro</label>
              <input value={form.bairro} onChange={set('bairro')} placeholder="Centro" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Cidade</label>
              <input value={form.cidade} onChange={set('cidade')} placeholder="Paulista" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Login do admin</label>
            <input value={form.login} onChange={set('login')} required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Senha do admin</label>
            <input value={form.senha} onChange={set('senha')} required minLength={4} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Vídeo / Foto de Fundo (login)</label>
          <input value={form.videoUrl} onChange={set('videoUrl')} placeholder="URL do vídeo (mp4/webm) ou foto (png/jpg)" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cor principal</label>
          <div className="flex flex-wrap gap-2">
            {CORES_DISPONIVEIS.map(({ cor, nome }) => (
              <button
                key={cor}
                type="button"
                onClick={() => { setForm((f) => ({ ...f, corPrincipal: cor })); setErro(''); }}
                className={`w-9 h-9 rounded-xl transition-all hover:scale-110 ${form.corPrincipal === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: cor }}
                title={nome}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={form.corPrincipal}
                onChange={(e) => { setForm((f) => ({ ...f, corPrincipal: e.target.value })); setErro(''); }}
                className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200 bg-white p-0"
                title="Cor personalizada"
              />
            </div>
          </div>
        </div>

        {erro && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
          {enviando ? 'Cadastrando...' : 'Cadastrar Empresa'}
        </button>
      </form>

      {criada && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-emerald-900">Empresa criada com sucesso!</h2>
              <p className="text-sm text-emerald-700">
                {criada.nomeEmpresa} está disponível no endereço <span className="font-medium">/{criada.slug}</span>.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { label: 'Painel de gestão', valor: `${window.location.origin}/${criada.slug}`, chave: 'admin' },
              { label: 'Loja pública', valor: `${window.location.origin}/${criada.slug}/commerce`, chave: 'commerce' },
            ].map((linha) => (
              <div key={linha.chave} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2.5">
                <Link2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{linha.label}</p>
                  <p className="truncate text-sm font-medium text-gray-800">{linha.valor}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copiar(linha.valor, linha.chave)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                  title="Copiar"
                >
                  {copiado === linha.chave ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/${slug}/empresas`)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Ir para empresas cadastradas
          </button>
        </div>
      )}
    </div>
  );
}
