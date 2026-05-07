"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/lib/stores/authStore";

const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000";

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
      try {
        if (!accessToken) {
          const { hasPortalSession } = await readSessionCookieStatus();
          if (hasPortalSession) {
            // Preserve signed cross-portal sessions when this origin has no local Supabase session.
            return;
          }

          await fetch("/api/auth/sync", { method: "DELETE" }).catch(() => undefined);
          return;
        }

        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
        }).catch(() => undefined);
      } catch {
        return;
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session ?? null;
      useAuthStore.getState().setInitialized(true);
      void syncSessionCookie(session?.access_token ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setInitialized(true);
      void syncSessionCookie(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      subscription.unsubscribe();
    };
  }, []);

  // Periodically validate role (allow only admin or customer for web-client)
  useEffect(() => {
    let cancelled = false;

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

            // A signed portal session is enough to keep web-client access when forcing cross-app navigation.
            if (syncPayload.hasPortalSession) {
              return;
            }

            if (syncPayload.hasAccessToken) {
              state.clearAuth();
              if (!cancelled) window.location.replace(`${CLIENT_LOGIN_URL}/login`);
              return;
            }
          }

          state.clearAuth();
          if (!cancelled) window.location.replace(`${CLIENT_LOGIN_URL}/login`);
          return;
        }

        const payload = (await res.json()) as { item?: { role_name?: string } };
        const roleName = (payload.item?.role_name ?? "").toString().trim().toLowerCase();

        const allowedForThisApp = roleName === "admin" || roleName === "customer";

        if (!allowedForThisApp) {
          state.clearAuth();
          if (!cancelled) window.location.replace(`${CLIENT_LOGIN_URL}/login`);
        }
      } catch {
        useAuthStore.getState().clearAuth();
        if (!cancelled) window.location.replace(`${CLIENT_LOGIN_URL}/login`);
      }
    }

    validateRole();
    const id = setInterval(validateRole, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
