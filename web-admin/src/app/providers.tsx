"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/lib/stores/authStore";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    let mounted = true;

    const readSessionCookieStatus = async () => {
      const response = await fetch("/api/auth/sync", { method: "GET" });
      if (!response.ok) {
        throw new Error("Unable to read auth cookie status");
      }

      const payload = (await response.json()) as {
        hasAccessToken?: boolean;
        hasPortalSession?: boolean;
      };

      return {
        hasAccessToken: Boolean(payload.hasAccessToken),
        hasPortalSession: Boolean(payload.hasPortalSession),
      };
    };

    const syncSessionCookie = async (accessToken: string | null) => {
      if (!accessToken) {
        try {
          const { hasPortalSession } = await readSessionCookieStatus();
          if (hasPortalSession) {
            // Keep the handoff session intact when Supabase has no local client session.
            return;
          }

          await fetch("/api/auth/sync", { method: "DELETE" }).catch(() => undefined);
        } catch {
          // Avoid destructive cleanup when cookie inspection fails.
          return;
        }

        return;
      }

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      }).catch(() => undefined);
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session ?? null;
      useAuthStore.getState().setAuth(session);
      useAuthStore.getState().setInitialized(true);
      void syncSessionCookie(session?.access_token ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setAuth(session ?? null);
      useAuthStore.getState().setInitialized(true);
      void syncSessionCookie(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Periodically validate the user's role and keep the admin app on localhost:3001
  useEffect(() => {
    let cancelled = false;

    const isAuthRoute = () => {
      if (typeof window === "undefined") return false;
      const path = window.location.pathname;
      return path === "/login" || path === "/register";
    };

    const redirectToLocalLoginIfNeeded = () => {
      if (cancelled || isAuthRoute()) {
        return;
      }

      window.location.replace("/login");
    };

    async function validateRole() {
      const state = useAuthStore.getState();
      if (!state.initialized) return;

      try {
        const res = await fetch("/api/users/me", {
          cache: "no-store",
        });

        if (!res.ok) {
          const syncResponse = await fetch("/api/auth/sync", { method: "GET" });
          if (syncResponse.ok) {
            const syncPayload = (await syncResponse.json()) as {
              hasAccessToken?: boolean;
              hasPortalSession?: boolean;
            };

            if (syncPayload.hasAccessToken || syncPayload.hasPortalSession) {
              state.clearAuth();
              redirectToLocalLoginIfNeeded();
              return;
            }
          }

          // If we cannot fetch the user profile treat as unauthorized
          state.clearAuth();
          redirectToLocalLoginIfNeeded();
          return;
        }

        const payload = (await res.json()) as { item?: { role_name?: string } };
        const roleName = (payload.item?.role_name ?? "").toString().trim().toLowerCase();

        const allowedForThisApp =
          roleName === "admin" || roleName === "employee";

        if (!allowedForThisApp) {
          state.clearAuth();
          redirectToLocalLoginIfNeeded();
        }
      } catch {
        useAuthStore.getState().clearAuth();
        redirectToLocalLoginIfNeeded();
      }
    }

    // Run immediately then every 10s
    validateRole();
    const id = setInterval(validateRole, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
