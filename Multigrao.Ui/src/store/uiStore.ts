import { create } from 'zustand';

interface UiStore {
  modalAberto: boolean;
  setModalAberto: (aberto: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  modalAberto: false,
  setModalAberto: (aberto) => set({ modalAberto: aberto }),
}));
