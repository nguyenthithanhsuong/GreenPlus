"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";
import { useAuthStore } from "@/lib/stores/authStore";

type Props = {
  children: React.ReactNode;
};

export default function PageGuard({ children }: Props) {
  const role = asPortalRole(
    useAuthStore((s) => s.user?.role_name ?? s.session?.role_name),
  );
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) =>
    Boolean(state.session && state.user),
  );

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [initialized, isAuthenticated, pathname, router]);

  if (!initialized) return null;

  if (!isAuthenticated && pathname !== "/login") return null;

  if (isAuthenticated && (!role || !canAccessPage(role, pathname))) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bạn không có quyền truy cập trang này.
          </p>
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
