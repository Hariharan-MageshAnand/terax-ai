import { create } from "zustand";
import { persist } from "zustand/middleware";

type ExplorerPrefs = {
  showHidden: boolean;
  setShowHidden: (v: boolean) => void;
  toggleShowHidden: () => void;
};

export const useExplorerPrefsStore = create<ExplorerPrefs>()(
  persist(
    (set, get) => ({
      showHidden: false,
      setShowHidden: (showHidden) => set({ showHidden }),
      toggleShowHidden: () => set({ showHidden: !get().showHidden }),
    }),
    { name: "terax-explorer-prefs" },
  ),
);
