"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
type Store = { store_id: string; name: string };
export default function StoreSwitcher() {
  const role = useAuthStore(
    (s) => s.user?.role_name ?? s.session?.role_name,
  )?.toLowerCase();
  const defaultStore = useAuthStore((s) => s.user?.store_id);
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (role !== "manager") return;
    let mounted = true;
    void fetch("/api/stores", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Store list unavailable");
        return response.json();
      })
      .then((result: { items?: Store[] }) => {
        if (!mounted) return;
        const items = result.items ?? [];
        setStores(items);
        const saved = document.cookie.match(
          /(?:^|;\s*)gp_current_store=([^;]+)/,
        )?.[1];
        const allowed = items.find((i) => i.store_id === saved);
        setSelected(
          allowed?.store_id ??
            items.find((i) => i.store_id === defaultStore)?.store_id ??
            [...items].sort((a, b) => a.store_id.localeCompare(b.store_id))[0]
              ?.store_id ??
            "",
        );
      })
      .catch(() => {
        if (mounted) setStores([]);
      });
    return () => {
      mounted = false;
    };
  }, [role, defaultStore]);
  if (stores.length <= 1) return null;
  return (
    <label className="flex max-w-[240px] items-center gap-2 text-xs font-semibold text-emerald-800">
      Cửa hàng
      <select
        aria-label="Cửa hàng hiện tại"
        className="min-w-0 max-w-[180px] rounded-lg border border-emerald-200 bg-white p-2 text-xs"
        value={selected}
        onChange={(event) => {
          const next = event.target.value;
          if (!stores.some((item) => item.store_id === next)) return;
          document.cookie = `gp_current_store=${next}; Path=/; SameSite=Lax; Max-Age=2592000`;
          setSelected(next);
          window.location.reload(); // Explicit store change must invalidate every client-side cache.
        }}
      >
        {stores.map((store) => (
          <option value={store.store_id} key={store.store_id}>
            {store.name}
          </option>
        ))}
      </select>
    </label>
  );
}
