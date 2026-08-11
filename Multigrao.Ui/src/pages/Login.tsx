import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, KeyRound, Loader2, Wheat } from 'lucide-react';
import GrainPattern from '../components/GrainPattern';
import FloatingProducts from '../components/FloatingProducts';
import { useSistemaStore } from '../store/sistemaStore';
import { getSlug, tenantHeaders } from '../services/tenantSetup';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [modoSuporte, setModoSuporte] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const config = useSistemaStore((state) => state.config);

  useEffect(() => {
    if (getSlug()) useSistemaStore.getState().carregar();
  }, []);

  const ehImagemFundo = config.videoUrl ? /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(config.videoUrl) : false;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      let response;
      if (modoSuporte) {
        response = await fetch(`${API_URL}/Auth/validar-senha-mestre`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
          body: JSON.stringify({ senha })
        });
      } else {
        response = await fetch(`${API_URL}/Auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders() },
          body: JSON.stringify({ usuario, senha })
        });
      }
      if (!response.ok) {
        const err = await response.json();
        setErro(err.message || 'Credenciais inválidas.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setAuth(data.token, data.nome, data.role, data.usuarioId, data.setores);
      navigate(`/${getSlug()}`);
    } catch {
      setErro('Erro de comunicação com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {config.videoUrl && !ehImagemFundo ? (
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0" key={config.videoUrl}>
          <source src={config.videoUrl} />
        </video>
      ) : config.videoUrl && ehImagemFundo ? (
        <img src={config.videoUrl} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
      ) : (
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/multigraosvid.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-black/60 z-[1]" />
      <GrainPattern opacity={0.10} color="#525252" className="inset-0 w-full h-full z-[2]" animated />
      <FloatingProducts className="z-[2]" />

      <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm anim-fade-in-up">
        <div className="mb-8 flex flex-col items-center text-center anim-fade-in-up">
          <img src={config.logoUrl} alt={config.nomeEmpresa} className="h-28 w-28 object-contain" />
          <div className="flex items-center gap-2 mt-3">
            <Wheat size={12} className="text-white/30" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              {config.slogan}
            </p>
            <Wheat size={12} className="text-white/30" />
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md anim-scale-in anim-delay-2"
        >
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <h2 className="font-heading text-lg text-white font-medium mb-0.5">
                {modoSuporte ? 'Acesso Administrativo' : 'Acesse sua conta'}
              </h2>
              <p className="text-xs text-white/30">
                {modoSuporte ? 'Insira a senha mestre para acesso total' : 'Entre com suas credenciais para continuar'}
              </p>
            </div>

            {erro && (
              <div className="bg-white/10 text-white/60 p-3 rounded-lg text-sm text-center border border-white/10 anim-scale-in">
                {erro}
              </div>
            )}

            <div className="flex flex-col gap-1.5 anim-slide-in-left anim-delay-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                {modoSuporte ? 'Senha Mestre' : 'Usuário'}
              </label>
              <input
                type={modoSuporte ? 'password' : 'text'}
                value={modoSuporte ? senha : usuario}
                onChange={(e) => modoSuporte ? setSenha(e.target.value) : setUsuario(e.target.value)}
                className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
                placeholder={modoSuporte ? 'Senha de administrador' : 'seu.usuario'}
                required
              />
            </div>

            {!modoSuporte && (
              <div className="flex flex-col gap-1.5 anim-slide-in-left anim-delay-4">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-10 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/30 transition-colors hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-white/5 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {modoSuporte ? 'Acessar como administrador' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => { setModoSuporte(v => !v); setErro(''); setSenha(''); setUsuario(''); }}
              className="flex items-center justify-center gap-2 text-xs text-white/30 transition-colors hover:text-white/60 mt-1"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {modoSuporte ? 'Voltar ao login normal' : 'Acesso via chave mestre'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[10px] text-white/20 uppercase tracking-[0.2em] anim-fade-in anim-delay-6">
          {config.nomeEmpresa} © {new Date().getFullYear()} — Acesso restrito
        </p>
      </div>
    </div>
  );
}
