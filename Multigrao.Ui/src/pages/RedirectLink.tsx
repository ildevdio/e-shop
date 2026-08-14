import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSistemaStore } from '../store/sistemaStore';

interface Redirecionamento {
  alias: string;
  tipo: 'produto' | 'categoria' | 'oferta' | 'colecao' | 'externo';
  destino?: string;
  url?: string;
}

export default function RedirectLink() {
  const { slug, alias } = useParams();
  const navigate = useNavigate();
  const carregada = useSistemaStore((state) => state.carregada);
  const carregar = useSistemaStore((state) => state.carregar);

  useEffect(() => {
    const disparar = async () => {
      if (!carregada) {
        try {
          await carregar();
        } catch {
          /* segue com o padrão local */
        }
      }

      const config = useSistemaStore.getState().config;
      const regras: Redirecionamento[] = [];
      if (config.redirecionamentos) {
        try {
          const parsed = JSON.parse(config.redirecionamentos);
          if (Array.isArray(parsed)) regras.push(...parsed);
        } catch {
          /* ignora JSON inválido */
        }
      }

      const aliasLimp = (alias ?? '').toLowerCase().trim();
      const regra = regras.find(r => (r.alias ?? '').toLowerCase().trim() === aliasLimp);

      if (regra && regra.tipo === 'externo' && regra.url) {
        window.location.replace(regra.url);
        return;
      }

      const base = `/${slug}/commerce`;
      if (regra && regra.tipo === 'produto' && regra.destino) {
        navigate(`${base}?produto=${encodeURIComponent(regra.destino)}`, { replace: true });
        return;
      }
      if (regra && regra.tipo === 'categoria' && regra.destino) {
        navigate(`${base}?cat=${encodeURIComponent(regra.destino)}`, { replace: true });
        return;
      }
      if (regra && (regra.tipo === 'oferta' || regra.tipo === 'colecao')) {
        navigate(`${base}?oferta=1`, { replace: true });
        return;
      }
      navigate(base, { replace: true });
    };
    disparar();
  }, [alias, slug, carregada, carregar, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#1f7a4d] animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Redirecionando...</p>
    </div>
  );
}
