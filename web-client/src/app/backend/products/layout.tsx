"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const topNavItems: NavItem[] = [
  { href: "/backend/products", label: "Product Backend" },
];

const productSubNavItems: NavItem[] = [
  { href: "/backend/products", label: "Overview" },
  { href: "/backend/products/auth", label: "Auth and Account" },
  { href: "/backend/products/qr", label: "QR Origin" },
  { href: "/backend/products/cart", label: "Cart and Notes" },
  { href: "/backend/products/reviews", label: "Reviews" },
  { href: "/backend/products/subscriptions", label: "Subscriptions" },
];

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";
const BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY = "backend-testing-access-token";

function navClass(isActive: boolean): string {
  return isActive
    ? "rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
    : "rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300";
}

export default function ProductBackendLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [inputUserId, setInputUserId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
  });
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedUserId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    return savedUserId || null;
  });

  const loginAsTestUser = () => {
    const normalized = inputUserId.trim();
    if (!normalized) {
      return;
    }

    window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, normalized);
    setActiveUserId(normalized);
  };

  const clearTestUser = () => {
    window.localStorage.removeItem(BACKEND_TEST_USER_STORAGE_KEY);
    window.localStorage.removeItem(BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY);
    setActiveUserId(null);
    setInputUserId("");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-300 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {topNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={navClass(isActive)}>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2 py-1">
              <span className="text-[11px] font-semibold text-slate-700">Test User</span>
              <input
                type="text"
                value={inputUserId}
                onChange={(event) => setInputUserId(event.target.value)}
                className="w-64 rounded border border-slate-300 px-2 py-1 text-xs"
                placeholder="Enter user_id"
              />
              <button
                onClick={loginAsTestUser}
                className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-white"
              >
                Login
              </button>
              <button
                onClick={clearTestUser}
                className="rounded bg-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-800"
              >
                Clear
              </button>
              <span className="text-[11px] text-slate-600">
                {activeUserId ? `Active: ${activeUserId}` : "No active user"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2">
            {productSubNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={navClass(isActive)}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
