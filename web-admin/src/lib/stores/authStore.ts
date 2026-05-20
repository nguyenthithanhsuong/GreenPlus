import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AdminSession = {
  session_id: string;
  user_id: string;
  login_time: string;
  role_name?: string | null;
  access_token?: string;
};

export type AdminUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
  role_name?: string | null;
};

type AuthState = {
  initialized: boolean;
  session: AdminSession | null;
  user: AdminUser | null;
  setAuth: (session: AdminSession | null, user?: AdminUser | null) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      initialized: false,
      session: null,
      user: null,
      setAuth: (session, user) =>
        set({
          session,
          user: user ?? null,
          initialized: true,
        }),
      setInitialized: (value) => set({ initialized: value }),
      clearAuth: () => set({ session: null, user: null, initialized: true }),
    }),
    {
      name: "gp_admin_auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
