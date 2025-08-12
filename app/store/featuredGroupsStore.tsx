import { create } from "zustand";

interface FeaturedGroupsState {
  featuredGroupIds: string[];
  setFeaturedGroupIds: (ids: string[]) => void;
  addFeaturedGroup: (id: string) => void;
  removeFeaturedGroup: (id: string) => void;
}

export const useFeaturedGroupsStore = create<FeaturedGroupsState>((set) => ({
  featuredGroupIds: [],
  setFeaturedGroupIds: (ids) => set({ featuredGroupIds: ids.slice(0, 5) }),
  addFeaturedGroup: (id) => set((state) => {
    if (state.featuredGroupIds.includes(id) || state.featuredGroupIds.length >= 5) return state;
    return { featuredGroupIds: [...state.featuredGroupIds, id].slice(0, 5) };
  }),
  removeFeaturedGroup: (id) => set((state) => ({
    featuredGroupIds: state.featuredGroupIds.filter(gid => gid !== id)
  })),
}));
