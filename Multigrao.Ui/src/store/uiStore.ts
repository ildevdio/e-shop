import { create } from 'zustand';

interface UiStore {
  modalAberto: boolean;
  modaisAbertos: number;
  setModalAberto: (aberto: boolean) => void;
  sidebarAberta: boolean;
  setSidebarAberta: (aberta: boolean) => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  modalAberto: false,
  modaisAbertos: 0,
  setModalAberto: (aberto) => {
    const proximo = aberto ? get().modaisAbertos + 1 : Math.max(0, get().modaisAbertos - 1);
    set({ modaisAbertos: proximo, modalAberto: proximo > 0 });
  },
  sidebarAberta: false,
  setSidebarAberta: (aberta) => set({ sidebarAberta: aberta }),
}));
