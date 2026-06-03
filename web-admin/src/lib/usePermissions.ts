"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/authStore";

export function usePermissions() {
  const session = useAuthStore((s) => s.session);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/permissions/me", { headers, cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to load permissions");
      setPermissions(Array.isArray(payload.permissions) ? payload.permissions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (key: string) => {
      if (!permissions) return false;
      
      return permissions.includes(key);
    },
    [permissions]
  );

  return { permissions, loading, error, fetchPermissions, hasPermission } as const;
}
