"use client";
import { useEffect } from "react";
/** Light-weight polling fallback while tenant-scoped Supabase Realtime policies are incomplete. */
export function useAutoReload(
  reload: () => void | Promise<unknown>,
  interval = 30000,
) {
  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const timer = window.setInterval(run, interval);
    window.addEventListener("focus", run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
    };
  }, [reload, interval]);
}
