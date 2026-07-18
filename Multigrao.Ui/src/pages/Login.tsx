import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (senha === '277353') {
      setAuth('master-jwt-token-777', 'Deus (Admin)', 'SuperAdmin', 0, ['Admin']);
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });

      if (!response.ok) {
        const err = await response.json();
        setErro(err.message || 'Usuário ou senha inválidos.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAuth(data.token, data.nome, data.role, data.usuarioId, data.setores);
      navigate('/');
    } catch {
      setErro('Erro de comunicação com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle corporate pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.5) 50px, rgba(255,255,255,0.5) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.5) 50px, rgba(255,255,255,0.5) 51px)' }}></div>
      
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[600px] h-[600px] bg-white rounded-full blur-[250px] opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mx-auto mb-5">
            <span className="text-[#111111] font-bold text-2xl font-heading">M</span>
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-wide text-white mb-1">Multigrãos</h1>
          <div className="w-8 h-[1px] bg-white/20 mx-auto my-3"></div>
          <p className="text-xs text-gray-500 uppercase tracking-[0.25em] font-medium">Sistema Interno de Gestão</p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-sm shadow-2xl p-8">
          <div className="mb-8">
            <h2 className="font-heading text-lg text-white font-medium mb-1">Acesse sua conta</h2>
            <p className="text-xs text-gray-500">Entre com suas credenciais para continuar</p>
          </div>

          {erro && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-sm text-sm mb-6 text-center border border-red-500/20">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] text-white rounded-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition-all placeholder-gray-600 text-sm"
                placeholder="Digite seu nome de usuário..."
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Senha ou Masterkey</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] text-white rounded-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition-all placeholder-gray-600 text-sm tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#111111] font-semibold tracking-wide py-3.5 rounded-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-6 hover:bg-gray-200 text-sm uppercase tracking-[0.15em]"
            >
              {loading ? (
                <span className="animate-pulse">Acessando...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Multigrãos © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
