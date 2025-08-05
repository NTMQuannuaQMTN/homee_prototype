import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type UserState = {
  user: any;
  session: Session | null;
  setUser: (user: any) => void;
  setSession: (session: Session | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
}));
