import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QalamEntry {
  id: string;
  date: string;
  note: string;
  verse: string;
  imageUrl?: string;
}

interface QalamState {
  history: QalamEntry[];
  addEntry: (entry: Omit<QalamEntry, "id" | "date">) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

export const useQalamStore = create<QalamState>()(
  persist(
    (set) => ({
      history: [],
      addEntry: (entry) =>
        set((state) => ({
          history: [
            {
              ...entry,
              id: `qalam-${Date.now()}`,
              date: new Date().toISOString(),
            },
            ...state.history,
          ],
        })),
      removeEntry: (id) =>
        set((state) => ({
          history: state.history.filter((entry) => entry.id !== id),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "qalam-history",
    }
  )
);
