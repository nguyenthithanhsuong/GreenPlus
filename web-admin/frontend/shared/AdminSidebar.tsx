"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Boxes,
  BrainCircuit,
  Building2,
  FileText,
  Image,
  LayoutDashboard,
  Package,
  PieChart,
  Settings,
  ServerCog,
  Shield,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole, canAccessPage, type PortalRole } from "@/lib/portal-access";

type MenuLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const groups: { label: string; items: MenuLink[] }[] = [
  { label: "Tổng quan", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audit", label: "Nhật ký hoạt động", icon: FileText },
  ] },
  { label: "Quản lý", items: [
    { href: "/settings/stores", label: "Cửa hàng", icon: Building2 },
    { href: "/users", label: "Người dùng", icon: Users },
    { href: "/roles", label: "Vai trò", icon: Shield },
    { href: "/system", label: "Hệ thống", icon: ServerCog },
    { href: "/suppliers", label: "Nhà cung cấp", icon: Store },
    { href: "/products", label: "Sản phẩm", icon: Package },
    { href: "/categories", label: "Danh mục", icon: Tag },
    { href: "/batches", label: "Lô hàng", icon: Boxes },
    { href: "/inventories", label: "Tồn kho", icon: Warehouse },
    { href: "/prices", label: "Giá bán & khuyến mãi", icon: Wallet },
    { href: "/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/shippers", label: "Giao hàng", icon: Truck },
    { href: "/complaints", label: "Khiếu nại", icon: AlertCircle },
    { href: "/customers", label: "Khách hàng", icon: PieChart },
    { href: "/greencreators", label: "Green Creator", icon: Image },
    { href: "/reports", label: "Báo cáo tài chính", icon: FileText },
    { href: "/ai/chat", label: "Trợ lý GreenPlus", icon: BrainCircuit },
    { href: "/settings/store", label: "Cửa hàng của tôi", icon: Store },
  ] },
];

const isActive = (path: string, href: string) => {
  if (href === "/ai/chat") {
    return path === "/ai/chat" || path === "/ai/knowledge";
  }
  if (href === "/ai") {
    return path === "/ai" || path === "/ai/suggestions";
  }
  return path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));
};

function SidebarLink({ item, active }: { item: MenuLink; active: boolean }) {
  const Icon = item.icon;
  return <Link href={item.href} aria-current={active ? "page" : undefined}
    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Icon size={19} aria-hidden="true" /><span>{item.label}</span>
  </Link>;
}

export default function AdminSidebar() {
  const path = usePathname();
  const role = asPortalRole(
    useAuthStore((state) => state.user?.role_name ?? state.session?.role_name),
  );

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-emerald-100 bg-white">
      <div className="border-b border-emerald-50 px-6 py-5">
        <Link href="/dashboard" className="text-2xl font-black tracking-tight text-emerald-700">
          Green<span className="text-lime-500">Plus</span>
        </Link>
        <p className="text-xs capitalize text-slate-500">Cổng {role ?? "quản trị"}</p>
      </div>
      <nav aria-label="Menu theo vai trò" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {role && groups.map((group) => {
          const entries = group.items.filter((item) => canAccessPage(role, item.href));
          if (!entries.length) return null;
          return (
            <div key={group.label}>
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {entries.map((item) => <li key={item.href}><SidebarLink item={item} active={isActive(path, item.href)} /></li>)}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-emerald-50">
          <Settings size={18} aria-hidden="true" />
          Thông tin cá nhân
        </Link>
      </div>
    </aside>
  );
}
