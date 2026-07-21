import { create } from "zustand";

type UIState = {
  isContactModalOpen: boolean;
  isFilterDrawerOpen: boolean;
  activePropertyModalId: string | null;
};

type UIActions = {
  setContactModalOpen: (open: boolean) => void;
  setFilterDrawerOpen: (open: boolean) => void;
  setActivePropertyModalId: (id: string | null) => void;
};

type UIStore = UIState & UIActions;

/**
 * Zustand store reserved strictly for ephemeral client UI state
 * (unsubmitted filter values, modal open/close state).
 * Server data is maintained by Server Components / TanStack Query.
 */
export const useUIStore = create<UIStore>()((set) => ({
  isContactModalOpen: false,
  isFilterDrawerOpen: false,
  activePropertyModalId: null,

  setContactModalOpen: (open: boolean) => set({ isContactModalOpen: open }),
  setFilterDrawerOpen: (open: boolean) => set({ isFilterDrawerOpen: open }),
  setActivePropertyModalId: (id: string | null) => set({ activePropertyModalId: id }),
}));
