import { create } from 'zustand';

interface AuthState {
  token: string | null;
  nome: string | null;
  role: string | null;
  usuarioId: number | null;
  setores: string[];
  setAuth: (token: string, nome: string, role: string, usuarioId: number, setores: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  nome: localStorage.getItem('nome'),
  role: localStorage.getItem('role'),
  usuarioId: localStorage.getItem('usuarioId') ? Number(localStorage.getItem('usuarioId')) : null,
  setores: JSON.parse(localStorage.getItem('setores') || '[]'),
  
  setAuth: (token, nome, role, usuarioId, setores) => {
    localStorage.setItem('token', token);
    localStorage.setItem('nome', nome);
    localStorage.setItem('role', role);
    localStorage.setItem('usuarioId', usuarioId.toString());
    localStorage.setItem('setores', JSON.stringify(setores));
    set({ token, nome, role, usuarioId, setores });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('role');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('setores');
    set({ token: null, nome: null, role: null, usuarioId: null, setores: [] });
  }
}));
