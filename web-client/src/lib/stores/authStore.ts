import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

type AuthState = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  setAuth: (session: Session | null) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  session: null,
  user: null,
  setAuth: (session) => set({ session, user: session?.user ?? null }),
  setInitialized: (value) => set({ initialized: value }),
  clearAuth: () => set({ session: null, user: null }),
}));
