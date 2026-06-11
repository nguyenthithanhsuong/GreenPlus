"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { useAuthStore } from "@/lib/stores/authStore";

type Props = {
  children: React.ReactNode;
};

export default function PageGuard({ children }: Props) {
  const { permissions, loading } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => Boolean(state.session && state.user));
  
  const map: Record<string, string> = {
    "/users": "users.read",
    "/roles": "roles.read",
    "/suppliers": "suppliers.read",
    "/products": "products.read",
    "/categories": "categories.read",
    "/batches": "batches.read",
    "/inventories": "inventory.read",
    "/prices": "prices.read",
    "/orders": "orders.read",
    "/shippers": "orders.assign",
    "/complaints": "complaints.read",
    "/customers": "reports.customer_analytics",
    "/greencreators": "content.read",
    "/reports": "reports.business_view",
  };

  function requiredPermissionForPath(path: string): string | null {
    for (const href of Object.keys(map)) {
      if (path === href || path.startsWith(href + "/")) return map[href];
    }
    return null;
  }

  const required = requiredPermissionForPath(pathname || "/");

  useEffect(() => {
  if (!initialized) return;
  if (!isAuthenticated && pathname !== "/login") {
    router.replace("/login");
  }
}, [initialized, isAuthenticated, pathname, router]);

  if (!initialized || loading) return null;

  if (!isAuthenticated && pathname !== "/login") return null;

  if (required && permissions && !permissions.includes(required)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
          <button
            className="px-4 py-2 bg-[#059669] text-white rounded"
            onClick={() => router.push("/dashboard")}
          >
            Quay về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}