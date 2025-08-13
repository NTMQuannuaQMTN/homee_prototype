import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeaturedGroupsState {
  featuredGroupIds: string[];
  setFeaturedGroupIds: (ids: string[]) => Promise<void>;
  addFeaturedGroup: (id: string) => Promise<void>;
  removeFeaturedGroup: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'featuredGroupIds';

export const useAsyncFeaturedGroupsStore = create<FeaturedGroupsState>((set, get) => ({
  featuredGroupIds: [],
  setFeaturedGroupIds: async (ids) => {
    const limited = ids.slice(0, 5);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    set({ featuredGroupIds: limited });
  },
  addFeaturedGroup: async (id) => {
    const current = get().featuredGroupIds;
    if (current.includes(id) || current.length >= 5) return;
    const updated = [...current, id].slice(0, 5);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ featuredGroupIds: updated });
  },
  removeFeaturedGroup: async (id) => {
    const updated = get().featuredGroupIds.filter(gid => gid !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ featuredGroupIds: updated });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) set({ featuredGroupIds: JSON.parse(stored) });
  },
}));
