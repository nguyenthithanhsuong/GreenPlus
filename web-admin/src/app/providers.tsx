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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
