import { useState, useEffect } from 'react';
import { Settings, Users, Shield, Palette, Plus, Edit3, Trash2, X, Check, Save, Bell, Clock, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

interface Usuario {
  id: number;
  nome: string;
  usuarioLogin: string;
  setores: string[];
  perfil: string;
  ativo: boolean;
}

export default function Configuracoes() {
  const { role, senhaMestreVerificada, setSenhaMestreVerificada } = useAuthStore();
  const { setModalAberto } = useUiStore();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permissoes' | 'sistema'>('usuarios');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  const [formNovoUsuario, setFormNovoUsuario] = useState({ nome: '', usuarioLogin: '', senha: '', perfil: 'Comum', setores: [] as string[] });
  const [setoresConfig, setSetoresConfig] = useState({ maxPorUsuario: 2, timeoutSessao: 480 });
  const [notificacoes, setNotificacoes] = useState({ email: true, push: true, pedido: false });
  const [corPrincipal, setCorPrincipal] = useState('#000000');
  const [corSalva, setCorSalva] = useState(false);

  const [senhaMestreModal, setSenhaMestreModal] = useState(false);
  const [senhaMestreInput, setSenhaMestreInput] = useState('');
  const [senhaMestreErro, setSenhaMestreErro] = useState('');
  const [senhaMestreLoading, setSenhaMestreLoading] = useState(false);

  const setores = ['Comercial', 'Separação', 'Logística', 'Conferência', 'Entregas', 'Compras', 'Vendedor'];
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
        headers: { 'Content-Type': 'application/json' },
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
      const resp = await fetch(`${API_URL}/Usuarios`);
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
      const resp = await fetch(`${API_URL}/Usuarios/${id}/toggle-ativo`, { method: 'PUT' });
      if (resp.ok) {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u));
      }
    } catch { /* ignora */ }
  };

  const excluirUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const resp = await fetch(`${API_URL}/Usuarios/${id}`, { method: 'DELETE' });
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
      const mapa: Record<string, number> = { 'Comercial': 1, 'Separação': 2, 'Logística': 3, 'Conferência': 4, 'Entregas': 5, 'Compras': 6, 'Vendedor': 7 };
      return mapa[s] || 0;
    }).filter(id => id > 0);

    try {
      if (usuarioEditando) {
        const resp = await fetch(`${API_URL}/Usuarios/${usuarioEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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

  const salvarConfigSistema = () => {
    setCorSalva(true);
    setTimeout(() => setCorSalva(false), 2000);
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
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
          >
            <Lock size={16} /> Informar Senha Mestre
          </button>
        </div>

        {senhaMestreModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
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
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm tracking-widest text-center"
                placeholder="••••••"
                autoFocus
              />
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => { setSenhaMestreModal(false); setModalAberto(false); setSenhaMestreInput(''); setSenhaMestreErro(''); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
                <button onClick={validarSenhaMestre} disabled={!senhaMestreInput.trim() || senhaMestreLoading} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${senhaMestreInput.trim() && !senhaMestreLoading ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
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

      <div className="flex gap-2 mb-2">
        {[
          { id: 'usuarios' as const, label: 'Usuários', icon: Users },
          { id: 'permissoes' as const, label: 'Permissões', icon: Shield },
          { id: 'sistema' as const, label: 'Sistema', icon: Palette },
        ].map(tab => (
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
              <button onClick={abrirNovoUsuario} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
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
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
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
          <div className="p-6 overflow-y-auto space-y-6">
            <h2 className="text-lg font-serif font-semibold text-gray-800">Configurações do Sistema</h2>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Palette size={18} className="text-black" /> Aparência</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                  <div className="flex gap-3">
                    {[{ cor: '#000000', nome: 'Preto' }, { cor: '#3b82f6', nome: 'Blue' }, { cor: '#8b5cf6', nome: 'Purple' }, { cor: '#f59e0b', nome: 'Amber' }, { cor: '#ef4444', nome: 'Red' }].map(({ cor, nome }) => (
                      <button key={cor} onClick={() => setCorPrincipal(cor)} className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${corPrincipal === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: cor }} title={nome} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                    <button onClick={() => setNotificacoes({ ...notificacoes, [item.key]: !notificacoes[item.key] })} className={`w-11 h-6 rounded-full transition-all relative ${notificacoes[item.key] ? 'bg-black' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notificacoes[item.key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-black" /> Regras de Negócio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Setores por Usuário</label>
                  <input type="number" value={setoresConfig.maxPorUsuario} onChange={e => setSetoresConfig({ ...setoresConfig, maxPorUsuario: parseInt(e.target.value) || 1 })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout de Sessão (min)</label>
                  <input type="number" value={setoresConfig.timeoutSessao} onChange={e => setSetoresConfig({ ...setoresConfig, timeoutSessao: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black bg-white" />
                </div>
              </div>
            </div>

            <button onClick={salvarConfigSistema} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
              corSalva ? 'bg-gray-800 text-white shadow-black/20' : 'bg-black text-white hover:bg-gray-800 shadow-black/20'
            }`}>
              {corSalva ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> Salvar Configurações</>}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-gray-900">{usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => { setIsModalOpen(false); setModalAberto(false); setUsuarioEditando(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input type="text" value={formNovoUsuario.nome} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, nome: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Digite o nome..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                <input type="text" value={formNovoUsuario.usuarioLogin} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, usuarioLogin: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Nome de usuário para login..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{usuarioEditando ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input type="password" value={formNovoUsuario.senha} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, senha: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select value={formNovoUsuario.perfil} onChange={e => setFormNovoUsuario({ ...formNovoUsuario, perfil: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm">
                  {perfis.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setores (Máx. {setoresConfig.maxPorUsuario})</label>
                <div className="flex flex-wrap gap-2">
                  {setores.map(setor => (
                    <button key={setor} onClick={() => toggleSetorForm(setor)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${formNovoUsuario.setores.includes(setor) ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
              <button onClick={salvarUsuario} disabled={!formNovoUsuario.nome.trim() || !formNovoUsuario.usuarioLogin.trim() || loading} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${formNovoUsuario.nome.trim() && formNovoUsuario.usuarioLogin.trim() && !loading ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {loading ? 'Salvando...' : usuarioEditando ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
