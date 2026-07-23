import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050';

export default function WakeUpBanner() {
  const [waking, setWaking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/api/Health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          if (!cancelled) setReady(true);
          return;
        }
      } catch {
        if (cancelled) return;
        setWaking(true);
        timeout = setTimeout(ping, 3000);
      }
    };

    ping();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!waking || ready) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-300/30 bg-card p-8 shadow-xl max-w-sm text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Servidor iniciando...
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O servidor está em modo de teste e pode levar
          <strong className="text-foreground"> 20 a 40 segundos </strong>
          para responder. Essa é uma limitação da versão gratuita de hospedagem.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          Aguarde, o sistema será carregado automaticamente.
        </div>
      </div>
    </div>
  );
}
