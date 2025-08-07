import { supabase } from "@/utils/supabase";
import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type SignupInfo = { email?: string, phone?: string };

type AuthState = {
  user: User | null;
  session: Session | null;
  signupInfo: SignupInfo | null;
  isLoading: boolean;
  password: string;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setSignupInfo: (info: SignupInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setPass: (s: string) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  signupInfo: null,
  isLoading: false,
  password: '',
  error: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setSignupInfo: (info) => set({ signupInfo: info }),
  setLoading: (isLoading) => set({ isLoading }),
  setPass: (s: string) => set({password: s}),
  setError: (error) => set({ error }),
  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, signupInfo: null, isLoading: false, password: '', });
  },
}));