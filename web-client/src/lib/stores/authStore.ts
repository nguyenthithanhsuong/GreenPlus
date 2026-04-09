import { create } from "zustand";

const AUTH_STORAGE_KEY = "greenplus-customer-auth";
const AUTH_SESSION_TTL_MINUTES = 6000;

export type AuthUserProfile = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
};

export type AuthSessionRecord = {
  session_id: string;
  user_id: string;
  login_time: string;
};

type StoredAuthRecord = {
  session: AuthSessionRecord;
  user: AuthUserProfile;
  token: string;
  expiresAt: number;
};

type SetAuthInput = {
  session: AuthSessionRecord;
  user: AuthUserProfile;
  token?: string;
};

type AuthState = {
  initialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: number | null;
  session: AuthSessionRecord | null;
  user: AuthUserProfile | null;
  setAuth: (input: SetAuthInput) => void;
  updateUser: (patch: Partial<AuthUserProfile>) => void;
  restoreAuth: () => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
};

function readStoredAuth(): StoredAuthRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthRecord;
  } catch {
    return null;
  }
}

function writeStoredAuth(value: StoredAuthRecord | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

function buildExpiry(): number {
  return Date.now() + AUTH_SESSION_TTL_MINUTES * 60_000;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  isAuthenticated: false,
  token: null,
  expiresAt: null,
  session: null,
  user: null,
  setAuth: ({ session, user, token }) => {
    const nextToken = token ?? session.session_id;
    const nextExpiresAt = buildExpiry();

    writeStoredAuth({
      session,
      user,
      token: nextToken,
      expiresAt: nextExpiresAt,
    });

    set({
      initialized: true,
      isAuthenticated: true,
      token: nextToken,
      expiresAt: nextExpiresAt,
      session,
      user,
    });
  },
  updateUser: (patch) => {
    const current = get();
    if (!current.session || !current.user || !current.token || !current.expiresAt) {
      return;
    }

    const nextUser: AuthUserProfile = {
      ...current.user,
      ...patch,
    };

    writeStoredAuth({
      session: current.session,
      user: nextUser,
      token: current.token,
      expiresAt: current.expiresAt,
    });

    set({ user: nextUser });
  },
  restoreAuth: () => {
    const stored = readStoredAuth();

    if (!stored) {
      get().clearAuth();
      set({ initialized: true });
      return;
    }

    if (stored.expiresAt <= Date.now()) {
      get().clearAuth();
      set({ initialized: true });
      return;
    }

    set({
      initialized: true,
      isAuthenticated: true,
      token: stored.token,
      expiresAt: stored.expiresAt,
      session: stored.session,
      user: stored.user,
    });
  },
  setInitialized: (value) => set({ initialized: value }),
  clearAuth: () => {
    writeStoredAuth(null);
    set({
      initialized: true,
      isAuthenticated: false,
      token: null,
      expiresAt: null,
      session: null,
      user: null,
    });
  },
}));

export { AUTH_SESSION_TTL_MINUTES, AUTH_STORAGE_KEY };
