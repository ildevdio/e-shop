import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchModal from './SearchModal';

interface Props {
  titulo: string;
  descricao?: string;
  voltarPara?: string;
  busca: string;
  onBuscaChange: (val: string) => void;
  onNovo?: () => void;
  novoLabel?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  titulo,
  descricao,
  voltarPara,
  busca,
  onBuscaChange,
  onNovo,
  novoLabel = 'Novo',
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {voltarPara && (
          <Link to={voltarPara} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-serif font-bold text-gray-900 truncate">{titulo}</h1>
          {descricao && <p className="text-gray-500 mt-1 truncate">{descricao}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <SearchModal placeholder={`Buscar em ${titulo.toLowerCase()}...`} valor={busca} onChange={onBuscaChange} />
        {onNovo && (
          <button
            onClick={onNovo}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-white text-sm font-medium hover:bg-primary transition-colors shadow-sm"
          >
            <Plus size={18} /> {novoLabel}
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
