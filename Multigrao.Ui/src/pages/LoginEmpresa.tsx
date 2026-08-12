import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Grainient from '../components/ui/Grainient';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api';

function mascaraCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function LoginEmpresa() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const response = await fetch(`${API_URL}/Auth/resolver-cnpj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setErro(err?.message || 'Empresa não encontrada.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      navigate(`/${data.slug}/login`);
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

      <div className="relative z-10 flex h-full flex-col overflow-y-auto overflow-x-hidden">
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl text-center anim-fade-in-up">
            <h1 className="font-heading mt-6 text-3xl font-semibold leading-[1.15] text-white sm:text-5xl anim-fade-in-up anim-delay-1">
              Seu negócio,
              <br />
              <span className="bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent">
                em um só lugar.
              </span>
            </h1>

            {/* ── Logo Focus e-shop ── */}
            <a href="/" className="mt-8 inline-flex items-center justify-center gap-3 anim-fade-in-up anim-delay-2">
              <img src="/focuswordmark.png" alt="Focus" className="h-12 w-auto sm:h-16" />
              <span className="text-3xl font-light tracking-tight text-white/90 sm:text-4xl">e-shop</span>
            </a>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/45 sm:text-base anim-fade-in-up anim-delay-2">
              Acesse a loja da sua empresa com o CNPJ para gerenciar pedidos, clientes, catálogo e muito mais.
            </p>

            <form
              onSubmit={handleContinuar}
              className="mx-auto mt-8 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-left backdrop-blur-md anim-scale-in anim-delay-3 sm:p-7"
            >
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="font-heading text-base font-medium text-white sm:text-lg">Acessar loja da minha empresa</h2>
                  <p className="mt-0.5 text-xs text-white/30">Informe o CNPJ para continuar</p>
                </div>

                {erro && (
                  <div className="bg-white/10 text-white/60 p-3 rounded-lg text-sm text-center border border-white/10 anim-scale-in">
                    {erro}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 anim-slide-in-left anim-delay-4">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">CNPJ da empresa</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cnpj}
                    onChange={(e) => setCnpj(mascaraCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    required
                    autoFocus
                    className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-white/5 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? 'Buscando...' : 'Continuar'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-[10px] text-white/20 uppercase tracking-[0.2em] anim-fade-in anim-delay-6">
              Acesso restrito às empresas cadastradas
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
