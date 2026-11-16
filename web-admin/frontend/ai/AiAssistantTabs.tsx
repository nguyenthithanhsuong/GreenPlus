"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";

type Tab = "chat" | "knowledge";

export default function AiAssistantTabs({ active }: { active: Tab }) {
  const role = asPortalRole(
    useAuthStore((state) => state.user?.role_name ?? state.session?.role_name),
  );
  const items = [
    { href: "/ai/chat", label: "Hỏi đáp", id: "chat" },
    { href: "/ai/knowledge", label: "Kho tri thức", id: "knowledge" },
  ] as const;

  return (
    <nav aria-label="Trợ lý GreenPlus" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {items.filter((item) => role && canAccessPage(role, item.href)).map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active === item.id ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
