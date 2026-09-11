import { create } from 'zustand';

export interface EmpresaInfo {
  id: number;
  nomeEmpresa: string;
  slug: string;
  empresaMatrizId?: number | null;
}

function lerEmpresas(): EmpresaInfo[] {
  try {
    const raw = localStorage.getItem('empresas');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface AuthState {
  token: string | null;
  nome: string | null;
  role: string | null;
  usuarioId: number | null;
  setores: string[];
  empresas: EmpresaInfo[];
  senhaMestreVerificada: boolean;
  setAuth: (token: string, nome: string, role: string, usuarioId: number, setores: string[], empresas?: EmpresaInfo[]) => void;
  setSessaoEmpresa: (token: string, empresas: EmpresaInfo[]) => void;
  setSenhaMestreVerificada: (verificada: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  nome: localStorage.getItem('nome'),
  role: localStorage.getItem('role'),
  usuarioId: localStorage.getItem('usuarioId') ? Number(localStorage.getItem('usuarioId')) : null,
  setores: JSON.parse(localStorage.getItem('setores') || '[]'),
  empresas: lerEmpresas(),
  senhaMestreVerificada: localStorage.getItem('senhaMestreVerificada') === 'true',

  setAuth: (token, nome, role, usuarioId, setores, empresas) => {
    const listaEmpresas = empresas ?? lerEmpresas();
    localStorage.setItem('token', token);
    localStorage.setItem('nome', nome);
    localStorage.setItem('role', role);
    localStorage.setItem('usuarioId', usuarioId.toString());
    localStorage.setItem('setores', JSON.stringify(setores));
    localStorage.setItem('empresas', JSON.stringify(listaEmpresas));
    set({ token, nome, role, usuarioId, setores, empresas: listaEmpresas });
  },

  setSessaoEmpresa: (token, empresas) => {
    localStorage.setItem('token', token);
    localStorage.setItem('empresas', JSON.stringify(empresas));
    set({ token, empresas });
  },

  setSenhaMestreVerificada: (verificada) => {
    localStorage.setItem('senhaMestreVerificada', verificada.toString());
    set({ senhaMestreVerificada: verificada });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('role');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('setores');
    localStorage.removeItem('empresas');
    localStorage.removeItem('senhaMestreVerificada');
    set({ token: null, nome: null, role: null, usuarioId: null, setores: [], empresas: [], senhaMestreVerificada: false });
  }
}));
