import { create } from 'zustand';

interface GraphStore {
  /** Node id selected in the graph explorer (null = none). */
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),
}));
