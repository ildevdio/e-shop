import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Wheat } from 'lucide-react';
import Grainient from '../components/ui/Grainient';
import { useSistemaStore } from '../store/sistemaStore';
import { getSlug, tenantHeaders } from '../services/tenantSetup';
import { midiaUrl } from '../utils/imageUrl';

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

  const logo = midiaUrl(config.logoUrl);

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
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* ── Fundo animado (Grainient) ── */}
      <div className="absolute inset-0">
        <Grainient
          color1="#000000"
          color2="#141414"
          color3="#3a0d63"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.8}
          gamma={1}
          saturation={1.3}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      <div className="absolute inset-0 bg-black/25" />

      {/* ── Botão voltar para /login ── */}
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
        title="Voltar para a tela de empresas"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex h-full flex-col overflow-y-auto overflow-x-hidden">
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl text-center anim-fade-in-up">
            {/* ── Marca da empresa ── */}
            <div className="flex flex-col items-center anim-fade-in-up">
              <img src={logo} alt={config.nomeEmpresa} className="h-28 w-28 object-contain sm:h-36 sm:w-36" />
              <div className="mt-4 flex items-center gap-2">
                <Wheat size={12} className="text-white/30" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 sm:text-[11px]">
                  {config.slogan}
                </p>
                <Wheat size={12} className="text-white/30" />
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="mx-auto mt-8 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-left backdrop-blur-md anim-scale-in anim-delay-2 sm:p-7"
            >
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="font-heading text-base font-medium text-white sm:text-lg">
                    {modoSuporte ? 'Acesso Administrativo' : 'Acesse sua conta'}
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
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
        </main>
      </div>
    </div>
  );
}
