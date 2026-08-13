import { useState, useEffect } from 'react';
import { Settings, Users, Shield, Palette, Plus, Edit3, Trash2, X, Check, Save, Bell, Clock, Lock, Building2, Store, LayoutGrid, ShoppingCart, UploadCloud, Loader2, ImageIcon, Eye, Menu, SlidersHorizontal, User, ChevronLeft, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useSistemaStore, FONTES_ECOMMERCE, DESIGNS_ECOMMERCE } from '../store/sistemaStore';
import { tenantHeaders, getSlug } from '../services/tenantSetup';
import { mascaraCep, buscarCep } from '../services/cep';
import { CORES_GRADE } from '../services/cores';
import { midiaUrl } from '../utils/imageUrl';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

interface Usuario {
  id: number;
  nome: string;
  usuarioLogin: string;
  setores: string[];
  perfil: string;
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

function SeletorCor({
  valor,
  onChange,
  valorPadrao,
}: {
  valor: string;
  onChange: (valor: string) => void;
  valorPadrao?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 w-fit">
      {CORES_GRADE.map(({ cor, nome }) => (
        <button
          key={cor}
          onClick={() => onChange(cor)}
          className={`w-9 h-9 rounded-xl transition-all hover:scale-110 ${valor === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
          style={{ backgroundColor: cor }}
          title={nome}
        />
      ))}
      <label
        className="relative w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
        style={{ background: 'conic-gradient(from 90deg, #f87171, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f87171)' }}
        title="Cor personalizada"
      >
        <input
          type="color"
          value={valorPadrao ?? valor}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function PreviewLoja({
  tituloHero,
  subtextoHero,
  exibirNomeAbaixoLogo,
  tipoMenu,
  tipoCarrinho,
  nomeEmpresa,
}: {
  tituloHero: string;
  subtextoHero: string;
  exibirNomeAbaixoLogo: boolean;
  tipoMenu: string;
  tipoCarrinho: string;
  nomeEmpresa: string;
}) {
  const nav = (() => {
    if (tipoMenu === 'hamburguer') return 'hamburguer';
    if (tipoMenu === 'lateral') return 'lateral';
    return 'dock';
  })();
  const carrinho = tipoCarrinho === 'drawer' ? 'drawer' : 'pagina';

  return (
    <div className="space-y-4">
      {/* Navegador */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-2 flex-1 max-w-[140px] h-3 rounded bg-gray-200" />
        </div>

        <div className="relative p-3">
          {/* Nav da loja */}
          <div className="flex items-center justify-between gap-2 pb-3">
            {nav === 'dock' ? (
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full border-2 border-gray-300 flex items-center justify-center"><SlidersHorizontal size={13} className="text-gray-400" /></span>
                <span className="h-6 w-28 rounded-full bg-gray-200" />
              </div>
            ) : nav === 'hamburguer' ? (
              <span className="h-7 w-7 rounded-full border-2 border-gray-300 flex items-center justify-center"><Menu size={13} className="text-gray-400" /></span>
            ) : (
              <span className="hidden md:block" />
            )}
            <span className="h-3 w-24 rounded bg-gray-300 mx-1" />
            <div className="flex items-center gap-1.5">
              {nav === 'dock' && (
                <>
                  <span className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center"><User size={13} className="text-gray-400" /></span>
                  <span className="relative h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                    <ShoppingCart size={13} className="text-white" />
                    <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 rounded-full bg-primary text-white text-[7px] font-bold flex items-center justify-center">2</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sidebar lateral recolhida/expandida */}
          {nav === 'lateral' && (
            <div className="absolute left-3 top-14 bottom-3 w-44 rounded-xl border-2 border-gray-200 bg-white shadow-sm p-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="h-2 w-20 rounded bg-gray-400" />
                <span className="h-5 w-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center"><ChevronLeft size={12} className="text-gray-400" /></span>
              </div>
              <span className="h-6 w-full rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center gap-1"><Search size={11} className="text-gray-400" /> <span className="h-1.5 w-14 rounded bg-gray-300" /></span>
              <span className="h-5 w-full rounded-lg bg-gray-100 flex items-center justify-center"><SlidersHorizontal size={12} className="text-gray-400" /></span>
              <span className="h-5 w-full rounded-lg bg-gray-100 flex items-center justify-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-gray-300" />
                <span className="h-1.5 w-8 rounded bg-gray-300" />
              </span>
              <span className="mt-auto h-5 w-full rounded-lg bg-gray-100 flex items-center justify-center gap-1.5"><User size={12} className="text-gray-400" /> <span className="h-1.5 w-10 rounded bg-gray-300" /></span>
              <span className="relative h-5 w-full rounded-lg bg-gray-100 flex items-center justify-center gap-1.5">
                <ShoppingCart size={12} className="text-gray-400" /> <span className="h-1.5 w-10 rounded bg-gray-300" />
                <span className="absolute top-0.5 right-1.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-primary text-white text-[7px] font-bold flex items-center justify-center">2</span>
              </span>
            </div>
          )}

          {/* Hero */}
          <div className="rounded-xl bg-gray-100 border border-gray-200 p-3 h-40 relative overflow-hidden">
            <div className="flex flex-col items-start justify-end h-full gap-1.5">
              <span className="h-6 w-12 rounded bg-gray-300" />
              {exibirNomeAbaixoLogo && (
                <span className="h-2 w-14 rounded bg-gray-400" />
              )}
              <span className="h-3 w-40 rounded bg-gray-400" />
              <span className="h-2 w-28 rounded bg-gray-300" />
              <span className="h-5 w-16 rounded-full bg-gray-800 mt-1" />
            </div>
          </div>

          {/* Conteúdo / grid */}
          <div className="pt-3">
            <span className="block h-3 w-24 rounded bg-gray-300 mb-2" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-1.5 bg-white">
                  <div className="aspect-square rounded bg-gray-100" />
                  <div className="h-1.5 w-3/4 rounded bg-gray-300 mt-1" />
                  <div className="h-1.5 w-1/2 rounded bg-gray-200 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Drawer de carrinho */}
          {carrinho === 'drawer' && (
            <div className="absolute right-0 top-14 bottom-0 w-24 rounded-l-xl border border-gray-200 bg-white shadow-md p-2 flex flex-col gap-1.5">
              <span className="h-2 w-12 rounded bg-gray-300" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded bg-gray-100 border border-gray-200" />
                  <span className="h-1.5 flex-1 rounded bg-gray-200" />
                </div>
              ))}
              <span className="mt-auto h-5 w-full rounded-full bg-gray-800" />
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center gap-1">
          <Menu size={11} /> {nav === 'dock' ? 'Dock no topo' : nav === 'hamburguer' ? 'Hambúrguer' : 'Lateral recolhido'}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center gap-1">
          <ShoppingCart size={11} /> {carrinho === 'drawer' ? 'Carrinho drawer' : 'Carrinho página'}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center gap-1">
          <Eye size={11} /> {exibirNomeAbaixoLogo ? 'Nome abaixo da logo' : 'Sem nome na logo'}
        </span>
      </div>
      <p className="text-[11px] text-gray-400 italic truncate">
        {nomeEmpresa || 'Sua Empresa'} · {tituloHero || 'Título da loja'} · {subtextoHero || 'Subtexto'}
      </p>
    </div>
  );
}

export default function Configuracoes() {  const { role, senhaMestreVerificada, setSenhaMestreVerificada } = useAuthStore();
  const { setModalAberto } = useUiStore();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permissoes' | 'sistema'>(getSlug() === 'focus' ? 'sistema' : 'usuarios');
  const [sistemaTab, setSistemaTab] = useState<'empresa' | 'loja' | 'aparencia' | 'notificacoes' | 'regras'>('empresa');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  const [formNovoUsuario, setFormNovoUsuario] = useState({ nome: '', usuarioLogin: '', senha: '', perfil: 'Comum', setores: [] as string[] });
  const [setoresConfig, setSetoresConfig] = useState({ maxPorUsuario: 2, timeoutSessao: 480 });
  const [notificacoes, setNotificacoes] = useState({ email: true, push: true, pedido: false });
  const [corPrincipal, setCorPrincipal] = useState('#000000');
  const [corSecundaria, setCorSecundaria] = useState('#f97316');
  const [corFonte, setCorFonte] = useState('');
  const [fonte, setFonte] = useState('classica');
  const [designEcommerce, setDesignEcommerce] = useState('claro');
  const [corSalva, setCorSalva] = useState(false);

  const configSistema = useSistemaStore((state) => state.config);
  const carregada = useSistemaStore((state) => state.carregada);
  const atualizarConfig = useSistemaStore((state) => state.atualizar);
  const salvarConfig = useSistemaStore((state) => state.salvar);
  const [formEmpresa, setFormEmpresa] = useState({ nomeEmpresa: '', cnpj: '', slogan: '', endereco: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', logoUrl: '', videoUrl: '', tituloHero: '', subtextoHero: '', exibirNomeAbaixoLogo: true, tipoMenu: 'dock', tipoCarrinho: 'pagina' });
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoVideo, setEnviandoVideo] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    if (carregada) {
      setCorPrincipal(configSistema.corPrincipal);
      setCorSecundaria(configSistema.corSecundaria);
      setCorFonte(configSistema.corFonte);
      setFonte(configSistema.fonte);
      setDesignEcommerce(DESIGNS_ECOMMERCE[configSistema.designEcommerce] ? configSistema.designEcommerce : 'claro');
      setFormEmpresa({
        nomeEmpresa: configSistema.nomeEmpresa,
        cnpj: configSistema.cnpj,
        slogan: configSistema.slogan,
        endereco: configSistema.endereco,
        cep: configSistema.cep,
        logradouro: configSistema.logradouro,
        numero: configSistema.numero,
        bairro: configSistema.bairro,
        cidade: configSistema.cidade,
        estado: configSistema.estado,
        logoUrl: configSistema.logoUrl,
        videoUrl: configSistema.videoUrl ?? '',
        tituloHero: configSistema.tituloHero,
        subtextoHero: configSistema.subtextoHero,
        exibirNomeAbaixoLogo: configSistema.exibirNomeAbaixoLogo,
        tipoMenu: configSistema.tipoMenu,
        tipoCarrinho: configSistema.tipoCarrinho,
      });
    }
  }, [carregada]);

  const [senhaMestreModal, setSenhaMestreModal] = useState(false);
  const [senhaMestreInput, setSenhaMestreInput] = useState('');
  const [senhaMestreErro, setSenhaMestreErro] = useState('');
  const [senhaMestreLoading, setSenhaMestreLoading] = useState(false);

  const setores = ['Comercial', 'Separação', 'Logística', 'Conferência', 'Entregas', 'Compras', 'Vendedor', 'Financeiro'];
  const perfis = ['AdminMaster', 'SuperAdmin', 'Comum'];

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const setoresAuth = useAuthStore((state) => state.setores);
  const temCompras = setoresAuth.some(s => normalize(s) === 'compras');

  const isAdmin = role === 'AdminMaster';
  const acessoPermitido = isAdmin || senhaMestreVerificada || temCompras;

  useEffect(() => {
    if (acessoPermitido) {
      carregarUsuarios();
    }
  }, [acessoPermitido]);

  const validarSenhaMestre = async () => {
    setSenhaMestreLoading(true);
    setSenhaMestreErro('');

    try {
      const response = await fetch(`${API_URL}/Auth/validar-senha-mestre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
        body: JSON.stringify({ senha: senhaMestreInput })
      });

      if (!response.ok) {
        setSenhaMestreErro('Senha mestre inválida.');
        setSenhaMestreLoading(false);
        return;
      }

      setSenhaMestreVerificada(true);
      setSenhaMestreModal(false);
      setModalAberto(false);
      setSenhaMestreInput('');
    } catch {
      setSenhaMestreErro('Erro de comunicação com o servidor.');
    }

    setSenhaMestreLoading(false);
  };

  const carregarUsuarios = async () => {
    try {
      const resp = await fetch(`${API_URL}/Usuarios`, { headers: tenantHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setUsuarios(data);
      }
    } catch {
      setUsuarios([]);
    }
  };

  const toggleAtivo = async (id: number) => {
    try {
      const resp = await fetch(`${API_URL}/Usuarios/${id}/toggle-ativo`, { method: 'PUT', headers: tenantHeaders() });
      if (resp.ok) {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u));
      }
    } catch { /* ignora */ }
  };

  const excluirUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const resp = await fetch(`${API_URL}/Usuarios/${id}`, { method: 'DELETE', headers: tenantHeaders() });
      if (resp.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id));
      }
    } catch { /* ignora */ }
  };

  const abrirNovoUsuario = () => {
    setUsuarioEditando(null);
    setFormNovoUsuario({ nome: '', usuarioLogin: '', senha: '', perfil: 'Comum', setores: [] });
    setIsModalOpen(true);
    setModalAberto(true);
  };

  const abrirEdicao = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormNovoUsuario({ nome: usuario.nome, usuarioLogin: usuario.usuarioLogin, senha: '', perfil: usuario.perfil, setores: [...usuario.setores] });
    setIsModalOpen(true);
    setModalAberto(true);
  };

  const toggleSetorForm = (setor: string) => {
    if (formNovoUsuario.setores.includes(setor)) {
      setFormNovoUsuario({ ...formNovoUsuario, setores: formNovoUsuario.setores.filter(s => s !== setor) });
    } else if (formNovoUsuario.setores.length < setoresConfig.maxPorUsuario) {
      setFormNovoUsuario({ ...formNovoUsuario, setores: [...formNovoUsuario.setores, setor] });
    }
  };

  const salvarUsuario = async () => {
    if (!formNovoUsuario.nome.trim() || !formNovoUsuario.usuarioLogin.trim()) return;
    setLoading(true);

    const setoresIds = formNovoUsuario.setores.map(s => {
      const mapa: Record<string, number> = { 'Comercial': 1, 'Separação': 2, 'Logística': 3, 'Conferência': 4, 'Entregas': 5, 'Compras': 6, 'Vendedor': 7, 'Financeiro': 8 };
      return mapa[s] || 0;
    }).filter(id => id > 0);

    try {
      if (usuarioEditando) {
        const resp = await fetch(`${API_URL}/Usuarios/${usuarioEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
          body: JSON.stringify({
            nome: formNovoUsuario.nome,
            usuarioLogin: formNovoUsuario.usuarioLogin,
            senha: formNovoUsuario.senha || undefined,
            perfil: formNovoUsuario.perfil,
            ativo: true,
            setoresIds
          })
        });
        if (resp.ok) {
          await carregarUsuarios();
        }
      } else {
        const resp = await fetch(`${API_URL}/Usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
          body: JSON.stringify({
            nome: formNovoUsuario.nome,
            usuarioLogin: formNovoUsuario.usuarioLogin,
            senha: formNovoUsuario.senha,
            perfil: formNovoUsuario.perfil,
            setoresIds
          })
        });
        if (resp.ok) {
          await carregarUsuarios();
        }
      }
    } catch { /* ignora */ }

    setLoading(false);
    setIsModalOpen(false);
    setModalAberto(false);
    setUsuarioEditando(null);
  };

  const salvarConfigSistema = async () => {
    setSalvandoConfig(true);
    const ok = await salvarConfig({
      nomeEmpresa: formEmpresa.nomeEmpresa,
      cnpj: formEmpresa.cnpj,
      slogan: formEmpresa.slogan,
      endereco: formEmpresa.endereco,
      cep: formEmpresa.cep,
      logradouro: formEmpresa.logradouro,
      numero: formEmpresa.numero,
      bairro: formEmpresa.bairro,
      cidade: formEmpresa.cidade,
      estado: formEmpresa.estado,
      logoUrl: formEmpresa.logoUrl,
      videoUrl: formEmpresa.videoUrl,
      corPrincipal,
      corSecundaria,
      corFonte,
      fonte,
      designEcommerce,
      tituloHero: formEmpresa.tituloHero,
      subtextoHero: formEmpresa.subtextoHero,
      exibirNomeAbaixoLogo: formEmpresa.exibirNomeAbaixoLogo,
      tipoMenu: formEmpresa.tipoMenu,
      tipoCarrinho: formEmpresa.tipoCarrinho,
    });
    setSalvandoConfig(false);
    if (ok) {
      setCorSalva(true);
      setTimeout(() => setCorSalva(false), 2000);
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setEnviandoLogo(true);
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
        setFormEmpresa(f => ({ ...f, logoUrl: data.url }));
      }
    } catch { /* ignora */ }
    setEnviandoLogo(false);
  };

  const uploadVideo = async (file: File | undefined) => {
    if (!file) return;
    setEnviandoVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_URL}/Upload/arquivo`, {
        method: 'POST',
        headers: tenantHeaders(),
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        setFormEmpresa(f => ({ ...f, videoUrl: data.url }));
      }
    } catch { /* ignora */ }
    setEnviandoVideo(false);
  };

  const buscarCepConfig = async () => {
    setBuscandoCep(true);
    const end = await buscarCep(formEmpresa.cep);
    if (end) {
      setFormEmpresa((f) => ({
        ...f,
        logradouro: end.logradouro,
        bairro: end.bairro,
        cidade: end.cidade,
        estado: end.estado,
      }));
    }
    setBuscandoCep(false);
  };

  if (!acessoPermitido) {
    return (
      <div className="space-y-6 h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 mb-6">Esta área requer autorização de administrador.</p>
          <button
            onClick={() => { setSenhaMestreModal(true); setModalAberto(true); }}
            className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 mx-auto"
          >
            <Lock size={16} /> Informar Senha Mestre
          </button>
        </div>

        {senhaMestreModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-gray-900">Senha Mestre</h2>
                <button onClick={() => { setSenhaMestreModal(false); setModalAberto(false); setSenhaMestreInput(''); setSenhaMestreErro(''); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Insira a senha mestre para acessar as configurações do sistema.</p>
              {senhaMestreErro && (
                <div className="bg-gray-50 text-gray-700 p-3 rounded-xl text-sm mb-4 text-center border border-gray-200">
                  {senhaMestreErro}
                </div>
              )}
              <input
                type="password"
                value={senhaMestreInput}
                onChange={(e) => setSenhaMestreInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && validarSenhaMestre()}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm tracking-widest text-center"
                placeholder="••••••"
                autoFocus
              />
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => { setSenhaMestreModal(false); setModalAberto(false); setSenhaMestreInput(''); setSenhaMestreErro(''); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
                <button onClick={validarSenhaMestre} disabled={!senhaMestreInput.trim() || senhaMestreLoading} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${senhaMestreInput.trim() && !senhaMestreLoading ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {senhaMestreLoading ? 'Validando...' : 'Validar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Settings size={28} /> Configurações
          </h1>
          <p className="text-gray-500 mt-1">Gerenciamento de usuários, setores e parâmetros do sistema.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {[
          { id: 'usuarios' as const, label: 'Usuários', icon: Users },
          { id: 'permissoes' as const, label: 'Permissões', icon: Shield },
          { id: 'sistema' as const, label: 'Sistema', icon: Palette },
        ].filter(tab => getSlug() !== 'focus' || tab.id === 'sistema').map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {activeTab === 'usuarios' && (
          <>
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-serif font-semibold text-gray-800">Usuários do Sistema</h2>
                <span className="text-xs text-gray-400 bg-gray-200 px-2.5 py-1 rounded-full font-medium">{usuarios.length} cadastrados</span>
              </div>
              <button onClick={abrirNovoUsuario} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={16} /> Novo Usuário
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Usuário</th>
                    <th className="px-6 py-3 font-semibold">Setores</th>
                    <th className="px-6 py-3 font-semibold">Perfil</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{usuario.nome}</div>
                            <div className="text-xs text-gray-400">@{usuario.usuarioLogin}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {usuario.setores.map(setor => (
                            <span key={setor} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{setor}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                          usuario.perfil === 'AdminMaster' ? 'bg-gray-50 text-gray-700 ring-gray-500/20' : usuario.perfil === 'SuperAdmin' ? 'bg-gray-50 text-gray-700 ring-gray-500/20' : 'bg-gray-100 text-gray-700 ring-gray-500/20'
                        }`}>{usuario.perfil}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleAtivo(usuario.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          usuario.ativo ? 'bg-gray-100 text-gray-800 ring-1 ring-black/20 hover:bg-gray-200' : 'bg-gray-50 text-gray-700 ring-1 ring-gray-500/20 hover:bg-gray-100'
                        }`}>
                          {usuario.ativo ? <Check size={12} /> : <X size={12} />}
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => abrirEdicao(usuario)} className="text-gray-600 hover:underline mr-3 flex items-center gap-1 inline-flex text-sm"><Edit3 size={14} /> Editar</button>
                        <button onClick={() => excluirUsuario(usuario.id)} className="text-gray-700 hover:underline flex items-center gap-1 inline-flex text-sm"><Trash2 size={14} /> Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'permissoes' && (
          <div className="p-6 overflow-y-auto">
            <h2 className="text-lg font-serif font-semibold text-gray-800 mb-6">Matriz de Permissões por Perfil</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-semibold text-gray-700">Módulo</th>
                    <th className="pb-3 font-semibold text-center text-gray-700">AdminMaster</th>
                    <th className="pb-3 font-semibold text-center text-gray-700">SuperAdmin</th>
                    <th className="pb-3 font-semibold text-center text-gray-700">Comum</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { modulo: 'Dashboard', admin: true, super: true, comum: true },
                    { modulo: 'Chat Interno', admin: true, super: true, comum: true },
                    { modulo: 'Mural da Empresa', admin: true, super: true, comum: true },
                    { modulo: 'Comercial', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Separação', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Logística', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Conferência', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Entregas', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Financeiro', admin: true, super: true, comum: 'Setor' },
                    { modulo: 'Gerenciar Catálogo', admin: true, super: true, comum: 'Setor (Compras)' },
                    { modulo: 'Configurações', admin: true, super: true, comum: 'Setor (Compras)' },
                    { modulo: 'Gerenciar Usuários', admin: true, super: false, comum: 'Setor (Compras)' },
                  ].map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{item.modulo}</td>
                      <td className="py-3 text-center">{item.admin ? <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-black rounded-lg"><Check size={16} strokeWidth={3} /></span> : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-400 rounded-lg"><X size={16} strokeWidth={3} /></span>}</td>
                      <td className="py-3 text-center">{item.super ? <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-black rounded-lg"><Check size={16} strokeWidth={3} /></span> : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-400 rounded-lg"><X size={16} strokeWidth={3} /></span>}</td>
                      <td className="py-3 text-center">
                        {typeof item.comum === 'string' ? <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">{item.comum}</span> : item.comum ? <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-black rounded-lg"><Check size={16} strokeWidth={3} /></span> : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-400 rounded-lg"><X size={16} strokeWidth={3} /></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">"Setor" significa que o usuário só acessa o módulo se tiver o setor atribuído no perfil.</p>
          </div>
        )}

        {activeTab === 'sistema' && (
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-3 bg-gray-50/50">
              {[
                { id: 'empresa' as const, label: 'Empresa', icon: Building2 },
                { id: 'loja' as const, label: 'Loja', icon: Store },
                { id: 'aparencia' as const, label: 'Aparência', icon: Palette },
                { id: 'notificacoes' as const, label: 'Notificações', icon: Bell },
                { id: 'regras' as const, label: 'Regras', icon: Clock },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSistemaTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                    sistemaTab === tab.id ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-gray-800">
                {sistemaTab === 'empresa' && 'Dados da Empresa'}
                {sistemaTab === 'loja' && 'Loja — Hero, Menu e Carrinho'}
                {sistemaTab === 'aparencia' && 'Aparência'}
                {sistemaTab === 'notificacoes' && 'Notificações'}
                {sistemaTab === 'regras' && 'Regras de Negócio'}
              </h2>
            </div>

            {sistemaTab === 'empresa' && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={18} className="text-black" /> Dados da Empresa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                  <input type="text" value={formEmpresa.nomeEmpresa} onChange={e => setFormEmpresa({ ...formEmpresa, nomeEmpresa: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Nome da empresa exibido no sistema" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input type="text" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({ ...formEmpresa, cnpj: mascaraCnpj(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / Subtítulo</label>
                  <input type="text" value={formEmpresa.slogan} onChange={e => setFormEmpresa({ ...formEmpresa, slogan: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ex.: Amendoim & Especiarias" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-500">CEP</label>
                        <div className="flex gap-2">
                          <input type="text" value={formEmpresa.cep} onChange={e => setFormEmpresa({ ...formEmpresa, cep: mascaraCep(e.target.value) })} placeholder="00000-000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                          <button type="button" onClick={buscarCepConfig} disabled={buscandoCep} className="shrink-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50">
                            {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar CEP'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Número</label>
                        <input type="text" value={formEmpresa.numero} onChange={e => setFormEmpresa({ ...formEmpresa, numero: e.target.value })} placeholder="123" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Estado (UF)</label>
                        <input type="text" value={formEmpresa.estado} onChange={e => setFormEmpresa({ ...formEmpresa, estado: e.target.value })} maxLength={2} placeholder="PE" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Logradouro</label>
                        <input type="text" value={formEmpresa.logradouro} onChange={e => setFormEmpresa({ ...formEmpresa, logradouro: e.target.value })} placeholder="Rua, avenida..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Bairro</label>
                        <input type="text" value={formEmpresa.bairro} onChange={e => setFormEmpresa({ ...formEmpresa, bairro: e.target.value })} placeholder="Centro" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Cidade</label>
                        <input type="text" value={formEmpresa.cidade} onChange={e => setFormEmpresa({ ...formEmpresa, cidade: e.target.value })} placeholder="Paulista" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {formEmpresa.logoUrl ? (
                        <img src={midiaUrl(formEmpresa.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 size={28} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary transition-colors cursor-pointer shadow-sm w-fit">
                        <UploadCloud size={16} /> {enviandoLogo ? 'Enviando...' : 'Enviar Logo'}
                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} disabled={enviandoLogo} />
                      </label>
                      {formEmpresa.logoUrl && (
                        <button onClick={() => setFormEmpresa({ ...formEmpresa, logoUrl: '' })} className="text-sm text-gray-600 hover:underline flex items-center gap-1 w-fit">
                          <Trash2 size={14} /> Remover logo
                        </button>
                      )}
                      <p className="text-[11px] text-gray-400 italic">PNG ou JPG. A logo substitui a marca exibida em todo o sistema.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-black" /> Vídeo / Foto de Fundo</h3>
                <p className="text-[11px] text-gray-400 mb-2">Exibido como fundo da tela de login e da hero da loja.</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formEmpresa.videoUrl ? (
                      /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(formEmpresa.videoUrl) ? (
                        <img src={midiaUrl(formEmpresa.videoUrl)} alt="Fundo" className="w-full h-full object-cover" />
                      ) : (
                        <video src={midiaUrl(formEmpresa.videoUrl)} muted playsInline className="w-full h-full object-cover" />
                      )
                    ) : (
                      <Building2 size={28} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary transition-colors cursor-pointer shadow-sm w-fit">
                      <UploadCloud size={16} /> {enviandoVideo ? 'Enviando...' : 'Enviar Vídeo/Foto'}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg" className="hidden" onChange={e => uploadVideo(e.target.files?.[0])} disabled={enviandoVideo} />
                    </label>
                    {formEmpresa.videoUrl && (
                      <button onClick={() => setFormEmpresa({ ...formEmpresa, videoUrl: '' })} className="text-sm text-gray-600 hover:underline flex items-center gap-1 w-fit">
                        <Trash2 size={14} /> Remover fundo
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <input type="text" value={formEmpresa.videoUrl} onChange={e => setFormEmpresa({ ...formEmpresa, videoUrl: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ou cole a URL do vídeo/foto" />
                </div>
              </div>
            </div>
            )}

            {sistemaTab === 'loja' && (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Store size={18} className="text-black" /> HeroPage</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título da HeroPage</label>
                        <input type="text" value={formEmpresa.tituloHero} onChange={e => setFormEmpresa({ ...formEmpresa, tituloHero: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ex.: O melhor da natureza para a sua loja." />
                        <p className="text-[11px] text-gray-400 mt-1 italic">Texto principal exibido sobre o vídeo/foto de fundo da loja.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtexto da HeroPage</label>
                        <input type="text" value={formEmpresa.subtextoHero} onChange={e => setFormEmpresa({ ...formEmpresa, subtextoHero: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ex.: Sua distribuidora de produtos naturais" />
                        <p className="text-[11px] text-gray-400 mt-1 italic">Frase curta exibida abaixo do título da loja.</p>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Nome abaixo da logo</div>
                          <div className="text-xs text-gray-400">Exibir o nome da empresa escrito logo abaixo da logo na HeroPage</div>
                        </div>
                        <button onClick={() => setFormEmpresa({ ...formEmpresa, exibirNomeAbaixoLogo: !formEmpresa.exibirNomeAbaixoLogo })} className={`w-11 h-6 rounded-full transition-all relative ${formEmpresa.exibirNomeAbaixoLogo ? 'bg-primary' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formEmpresa.exibirNomeAbaixoLogo ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><LayoutGrid size={18} className="text-black" /> Tipo de Menu</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'dock', nome: 'Dock fixo no topo', descricao: 'Barra flutuante no topo (no mobile vira um dock inferior).' },
                        { key: 'hamburguer', nome: 'Hambúrguer', descricao: 'Menu recolhido, aberto pelo botão no topo da loja.' },
                        { key: 'lateral', nome: 'Lateral recolhido', descricao: 'Menu colapsado na lateral esquerda da loja.' },
                      ].map(opcao => (
                        <div key={opcao.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{opcao.nome}</div>
                            <div className="text-xs text-gray-400">{opcao.descricao}</div>
                          </div>
                          <button onClick={() => setFormEmpresa({ ...formEmpresa, tipoMenu: opcao.key })} className={`w-11 h-6 rounded-full transition-all relative ${formEmpresa.tipoMenu === opcao.key ? 'bg-primary' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formEmpresa.tipoMenu === opcao.key ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ShoppingCart size={18} className="text-black" /> Tipo de Carrinho</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'pagina', nome: 'Página dedicada', descricao: 'O carrinho abre como uma página cheia da loja.' },
                        { key: 'drawer', nome: 'Drawer lateral', descricao: 'O carrinho desliza pela lateral direita sobre o catálogo.' },
                      ].map(opcao => (
                        <div key={opcao.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{opcao.nome}</div>
                            <div className="text-xs text-gray-400">{opcao.descricao}</div>
                          </div>
                          <button onClick={() => setFormEmpresa({ ...formEmpresa, tipoCarrinho: opcao.key })} className={`w-11 h-6 rounded-full transition-all relative ${formEmpresa.tipoCarrinho === opcao.key ? 'bg-primary' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formEmpresa.tipoCarrinho === opcao.key ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 xl:sticky xl:top-4">
                  <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><Eye size={18} className="text-black" /> Pré-visualização</h3>
                  <p className="text-[11px] text-gray-400 mb-4">Esboço em baixa fidelidade da loja conforme as opções selecionadas.</p>
                  <PreviewLoja
                    tituloHero={formEmpresa.tituloHero}
                    subtextoHero={formEmpresa.subtextoHero}
                    exibirNomeAbaixoLogo={formEmpresa.exibirNomeAbaixoLogo}
                    tipoMenu={formEmpresa.tipoMenu}
                    tipoCarrinho={formEmpresa.tipoCarrinho}
                    nomeEmpresa={formEmpresa.nomeEmpresa}
                  />
                </div>
              </div>
            )}

            {sistemaTab === 'aparencia' && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Palette size={18} className="text-black" /> Aparência</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                  <SeletorCor
                    valor={corPrincipal}
                    onChange={v => { setCorPrincipal(v); atualizarConfig({ corPrincipal: v }); }}
                  />
                  <p className="text-[11px] text-gray-400 mt-2 italic">A cor é aplicada imediatamente em todo o sistema.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Design do e-commerce</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(DESIGNS_ECOMMERCE).map(([key, d]) => (
                      <button
                        key={key}
                        onClick={() => { setDesignEcommerce(key); atualizarConfig({ designEcommerce: key }); }}
                        className={`text-left rounded-2xl p-4 transition-all border-2 ${designEcommerce === key ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: d.bg }} />
                          <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: d.card }} />
                          <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: d.strong }} />
                          <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: d.text }} />
                        </div>
                        <div className={`text-sm font-semibold ${designEcommerce === key ? 'text-gray-900' : 'text-gray-700'}`}>{d.nome}</div>
                        {d.descricao && <div className="text-[11px] text-gray-400 leading-snug mt-1">{d.descricao}</div>}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 italic">Estilo visual da loja: fundo, cards, bordas, botões e tons de texto do e-commerce.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fonte</label>
                  <select
                    value={fonte}
                    onChange={e => { setFonte(e.target.value); atualizarConfig({ fonte: e.target.value }); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    {Object.entries(FONTES_ECOMMERCE).map(([key, f]) => (
                      <option key={key} value={key}>{f.nome}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-2 italic">Tipografia dos títulos e do corpo do e-commerce.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                  <SeletorCor
                    valor={corSecundaria}
                    onChange={v => { setCorSecundaria(v); atualizarConfig({ corSecundaria: v }); }}
                  />
                  <p className="text-[11px] text-gray-400 mt-2 italic">Cor de destaque do e-commerce: separadores, avisos e botões secundários.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Fonte</label>
                  <SeletorCor
                    valor={corFonte}
                    onChange={v => { setCorFonte(v); atualizarConfig({ corFonte: v }); }}
                    valorPadrao="#18181b"
                  />
                  <button onClick={() => { setCorFonte(''); atualizarConfig({ corFonte: '' }); }} className="text-[11px] text-gray-500 hover:underline mt-2 italic">
                    Usar cor padrão do design
                  </button>
                  <p className="text-[11px] text-gray-400 mt-2 italic">Cor dos títulos e textos principais da loja.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vídeo / Foto de Fundo</label>
                  <p className="text-[11px] text-gray-400 mb-2">Exibido como fundo da tela de login da empresa.</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {formEmpresa.videoUrl ? (
                        /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(formEmpresa.videoUrl) ? (
                          <img src={midiaUrl(formEmpresa.videoUrl)} alt="Fundo" className="w-full h-full object-cover" />
                        ) : (
                          <video src={midiaUrl(formEmpresa.videoUrl)} muted playsInline className="w-full h-full object-cover" />
                        )
                      ) : (
                        <Building2 size={28} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary transition-colors cursor-pointer shadow-sm w-fit">
                        <UploadCloud size={16} /> {enviandoVideo ? 'Enviando...' : 'Enviar Vídeo/Foto'}
                        <input type="file" accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg" className="hidden" onChange={e => uploadVideo(e.target.files?.[0])} disabled={enviandoVideo} />
                      </label>
                      {formEmpresa.videoUrl && (
                        <button onClick={() => setFormEmpresa({ ...formEmpresa, videoUrl: '' })} className="text-sm text-gray-600 hover:underline flex items-center gap-1 w-fit">
                          <Trash2 size={14} /> Remover fundo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <input type="text" value={formEmpresa.videoUrl} onChange={e => setFormEmpresa({ ...formEmpresa, videoUrl: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ou cole a URL do vídeo/foto" />
                  </div>
                </div>
              </div>
            </div>
            )}

            {sistemaTab === 'notificacoes' && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Bell size={18} className="text-black" /> Notificações</h3>
              <div className="space-y-3">
                {[
                  { key: 'email' as const, label: 'Notificações por E-mail', descricao: 'Receber alertas importantes por e-mail' },
                  { key: 'push' as const, label: 'Notificações Push', descricao: 'Notificações no navegador' },
                  { key: 'pedido' as const, label: 'Alertas de Pedido', descricao: 'Aviso quando um pedido mudar de status' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.descricao}</div>
                    </div>
                    <button onClick={() => setNotificacoes({ ...notificacoes, [item.key]: !notificacoes[item.key] })} className={`w-11 h-6 rounded-full transition-all relative ${notificacoes[item.key] ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notificacoes[item.key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            )}

            {sistemaTab === 'regras' && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-black" /> Regras de Negócio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Setores por Usuário</label>
                  <input type="number" value={setoresConfig.maxPorUsuario} onChange={e => setSetoresConfig({ ...setoresConfig, maxPorUsuario: parseInt(e.target.value) || 1 })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout de Sessão (min)</label>
                  <input type="number" value={setoresConfig.timeoutSessao} onChange={e => setSetoresConfig({ ...setoresConfig, timeoutSessao: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
              </div>
            </div>
            )}

            <button onClick={salvarConfigSistema} disabled={salvandoConfig || !formEmpresa.nomeEmpresa.trim()} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
              corSalva ? 'bg-gray-800 text-white shadow-black/20' : salvandoConfig || !formEmpresa.nomeEmpresa.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary shadow-black/20'
            }`}>
              {corSalva ? <><Check size={16} /> Salvo!</> : salvandoConfig ? 'Salvando...' : <><Save size={16} /> Salvar Configurações</>}
            </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-gray-900">{usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => { setIsModalOpen(false); setModalAberto(false); setUsuarioEditando(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input type="text" value={formNovoUsuario.nome} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, nome: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" placeholder="Digite o nome..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                <input type="text" value={formNovoUsuario.usuarioLogin} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, usuarioLogin: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" placeholder="Nome de usuário para login..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{usuarioEditando ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input type="password" value={formNovoUsuario.senha} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, senha: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select value={formNovoUsuario.perfil} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, perfil: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm">
                  {perfis.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setores (Máx. {setoresConfig.maxPorUsuario})</label>
                <div className="flex flex-wrap gap-2">
                  {setores.map(setor => (
                    <button key={setor} onClick={() => toggleSetorForm(setor)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${formNovoUsuario.setores.includes(setor) ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {setor}
                    </button>
                  ))}
                </div>
                {formNovoUsuario.setores.length >= setoresConfig.maxPorUsuario && (
                  <p className="text-xs text-gray-600 mt-1">Máximo de {setoresConfig.maxPorUsuario} setores atingido.</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => { setIsModalOpen(false); setModalAberto(false); setUsuarioEditando(null); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={salvarUsuario} disabled={!formNovoUsuario.nome.trim() || !formNovoUsuario.usuarioLogin.trim() || loading} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${formNovoUsuario.nome.trim() && formNovoUsuario.usuarioLogin.trim() && !loading ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {loading ? 'Salvando...' : usuarioEditando ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
