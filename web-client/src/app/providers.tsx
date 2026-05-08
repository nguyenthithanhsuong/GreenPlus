"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

    useAuthStore.getState().restoreAuth();

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

    const isAuthRoute = () => {
      if (typeof window === "undefined") return false;
      const path = window.location.pathname;
      return path === "/login" || path === "/register";
    };

    const redirectToLoginIfNeeded = () => {
      if (cancelled || isAuthRoute()) {
        return;
      }

      window.location.replace(`${CLIENT_LOGIN_URL}/login`);
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

            // A signed portal session is enough to keep web-client access when forcing cross-app navigation.
            if (syncPayload.hasPortalSession) {
              return;
            }

            if (syncPayload.hasAccessToken) {
              state.clearAuth();
              redirectToLoginIfNeeded();
              return;
            }
          }

          state.clearAuth();
          redirectToLoginIfNeeded();
          return;
        }

        const payload = (await res.json()) as {
          item?: {
            role_name?: string;
            user_id?: string;
            email?: string;
            name?: string;
            phone?: string | null;
            address?: string | null;
            image_url?: string | null;
            status?: string;
          };
        };
        const roleName = (payload.item?.role_name ?? "").toString().trim().toLowerCase();

        const allowedForThisApp = roleName === "admin" || roleName === "customer";

        if (!allowedForThisApp) {
          state.clearAuth();
          redirectToLoginIfNeeded();
          return;
        }

        const userId = (payload.item?.user_id ?? "").toString().trim();
        const email = (payload.item?.email ?? "").toString().trim();

        if (userId && email) {
          const nextName = (payload.item?.name ?? "").toString().trim() || email;
          const shouldHydrateAuth =
            !state.isAuthenticated ||
            state.user?.user_id !== userId ||
            state.user?.email !== email;

          if (shouldHydrateAuth) {
            state.setAuth({
              session: {
                session_id: state.token ?? `portal:${userId}`,
                user_id: userId,
                login_time: new Date().toISOString(),
              },
              user: {
                user_id: userId,
                name: nextName,
                email,
                phone: payload.item?.phone ?? null,
                address: payload.item?.address ?? null,
                image_url: payload.item?.image_url ?? null,
                status: payload.item?.status ?? "active",
              },
              token: state.token ?? `portal:${userId}`,
            });
          }
        }
      } catch {
        useAuthStore.getState().clearAuth();
        redirectToLoginIfNeeded();
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
