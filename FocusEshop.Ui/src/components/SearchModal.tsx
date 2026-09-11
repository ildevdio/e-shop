import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  placeholder?: string;
  valor: string;
  onChange: (val: string) => void;
}

export default function SearchModal({ placeholder = 'Buscar...', valor, onChange }: Props) {
  const [aberto, setAberto] = useState(false);

  const abrir = () => { setAberto(true); };
  const fechar = () => setAberto(false);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        title="Buscar"
      >
        <Search size={18} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm" onClick={fechar}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Buscar</h3>
              <button onClick={fechar} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={valor}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">Os resultados são filtrados automaticamente.</p>
          </div>
        </div>
      )}
    </>
  );
}
