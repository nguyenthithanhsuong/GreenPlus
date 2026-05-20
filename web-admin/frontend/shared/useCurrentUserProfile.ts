"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../src/lib/stores/authStore";
import { UserSummary } from "../../backend/modules/users/user-management.types";

export type CurrentUserProfile = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  roleName: string;
  status: string;
};

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?u=greenplus-default-user";

export function useCurrentUserProfile() {
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  const [dbUser, setDbUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUserProfile = async () => {
      if (!initialized) {
        setDbUser((previous) => (previous === null ? previous : null));
        return;
      }

      const accessToken = typeof session?.access_token === "string" ? session.access_token.trim() : "";

      if (!accessToken) {
        setDbUser((previous) => (previous === null ? previous : null));
        return;
      }

      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        headers.Authorization = `Bearer ${accessToken}`;

        const response = await fetch("/api/users/me", {
          cache: "no-store",
          headers,
        });
        const payload = (await response.json()) as { item?: UserSummary; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Không thể tải danh sách người dùng");
        }

        if (!active) {
          return;
        }

        const matchedUser = payload.item ?? null;

        setDbUser((previous) => {
          if (
            previous?.user_id === matchedUser?.user_id &&
            previous?.name === matchedUser?.name &&
            previous?.email === matchedUser?.email &&
            previous?.phone === matchedUser?.phone &&
            previous?.address === matchedUser?.address &&
            previous?.image_url === matchedUser?.image_url &&
            previous?.role_name === matchedUser?.role_name &&
            previous?.status === matchedUser?.status
          ) {
            return previous;
          }

          return matchedUser;
        });
      } catch {
        if (active) {
          setDbUser((previous) => (previous === null ? previous : null));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUserProfile();

    return () => {
      active = false;
    };
  }, [initialized, session?.access_token, refreshToken]);

  const profile = useMemo<CurrentUserProfile | null>(() => {
    if (!user && !dbUser) {
      return null;
    }

    const storedUser = user ?? null;

    const name =
      dbUser?.name?.trim() ||
      storedUser?.name?.trim() ||
      (storedUser?.email ? storedUser.email.split("@")[0] : "Người dùng");

    const imageUrl =
      dbUser?.image_url ||
      storedUser?.image_url ||
      FALLBACK_AVATAR;

    const roleName =
      dbUser?.role_name ||
      storedUser?.role_name ||
      "Admin";

    return {
      userId: dbUser?.user_id ?? storedUser?.user_id ?? "",
      name,
      email: dbUser?.email ?? storedUser?.email ?? "",
      phone: dbUser?.phone ?? storedUser?.phone ?? "",
      address: dbUser?.address ?? storedUser?.address ?? "",
      imageUrl,
      roleName,
      status: dbUser?.status ?? "active",
    };
  }, [dbUser, user]);

  return {
    initialized,
    loading,
    profile,
    refreshProfile: () => setRefreshToken((value) => value + 1),
  };
}