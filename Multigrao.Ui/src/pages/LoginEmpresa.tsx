import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Store } from 'lucide-react';
import GrainPattern from '../components/GrainPattern';

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
  const [logoFailed, setLogoFailed] = useState(false);
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
      <GrainPattern opacity={0.08} color="#525252" className="inset-0 w-full h-full z-[1]" animated />

      <div className="relative z-10 w-full max-w-sm anim-fade-in-up">
        <div className="mb-8 flex flex-col items-center text-center anim-fade-in-up">
          {logoFailed ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Store className="h-8 w-8 text-white/80" />
            </div>
          ) : (
            <img
              src="/focus-eshop-logo.png"
              alt="Focus e-shop"
              onError={() => setLogoFailed(true)}
              className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 object-contain backdrop-blur-md"
            />
          )}
          <h1 className="font-heading mt-4 text-2xl font-semibold text-white leading-snug">
            Focus e-shop
          </h1>
          <p className="mt-1 text-sm text-white/50">A plataforma de gestão e vendas para o seu negócio</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mt-3">
            shop.focus-solutions.tech
          </p>
        </div>

        <form
          onSubmit={handleContinuar}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md anim-scale-in anim-delay-2"
        >
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <h2 className="font-heading text-lg text-white font-medium mb-0.5">Acessar loja da minha empresa</h2>
              <p className="text-xs text-white/30">Informe o CNPJ da empresa para continuar</p>
            </div>

            {erro && (
              <div className="bg-white/10 text-white/60 p-3 rounded-lg text-sm text-center border border-white/10 anim-scale-in">
                {erro}
              </div>
            )}

            <div className="flex flex-col gap-1.5 anim-slide-in-left anim-delay-3">
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

        <p className="mt-6 text-center text-[10px] text-white/20 uppercase tracking-[0.2em] anim-fade-in anim-delay-6">
          Acesso restrito às empresas cadastradas
        </p>
      </div>
    </div>
  );
}
