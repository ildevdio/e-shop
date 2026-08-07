import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface Sugestao {
  rotulo: string;
  subRotulo?: string;
}

interface Props {
  placeholder: string;
  valor: string;
  onChange: (val: string) => void;
  sugestoes: Sugestao[];
  aoSelecionar: (sugestao: Sugestao) => void;
  onBuscar?: () => void;
  className?: string;
  classNameInput?: string;
}

export default function SearchAutocomplete({ placeholder, valor, onChange, sugestoes, aoSelecionar, onBuscar, className = '', classNameInput }: Props) {
  const [aberto, setAberto] = useState(false);
  const [focoIndex, setFocoIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtradas = valor.trim()
    ? sugestoes.filter(s =>
        s.rotulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
          valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        )
      )
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selecionar = (s: Sugestao) => {
    onChange(s.rotulo);
    aoSelecionar(s);
    setAberto(true);
    setFocoIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!aberto || filtradas.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocoIndex(i => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocoIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focoIndex >= 0) {
      e.preventDefault();
      selecionar(filtradas[focoIndex]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setAberto(false);
      onBuscar?.();
    } else if (e.key === 'Tab' && focoIndex >= 0) {
      selecionar(filtradas[focoIndex]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setAberto(false); onBuscar?.(); }}
        className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Search size={18} />
      </button>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={valor}
        onChange={e => { onChange(e.target.value); setAberto(true); setFocoIndex(-1); }}
        onFocus={() => setAberto(true)}
        onKeyDown={handleKeyDown}
        className={classNameInput ?? 'w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all'}
      />
      {aberto && filtradas.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtradas.map((s, i) => {
            const partes = s.rotulo.split(new RegExp(`(${valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
            return (
              <button
                key={`${s.rotulo}-${i}`}
                onMouseDown={(e) => { e.preventDefault(); selecionar(s); }}
                onMouseEnter={() => setFocoIndex(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between ${i === focoIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <span className="font-medium text-gray-800 truncate">
                  {partes.map((parte, j) =>
                    parte.toLowerCase() === valor.toLowerCase() && valor.length > 0
                      ? <mark key={j} className="bg-amber-200 text-gray-900 rounded-sm px-0.5">{parte}</mark>
                      : <span key={j}>{parte}</span>
                  )}
                </span>
                {s.subRotulo && <span className="text-xs text-gray-400 shrink-0 ml-2">{s.subRotulo}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
