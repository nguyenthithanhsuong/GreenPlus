"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Boxes,
  FileText,
  Image,
  LayoutDashboard,
  Package,
  PieChart,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Warehouse,
  Wallet,
  Building2,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";

const groups = [
  {
    label: "Tổng quan",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/users", label: "Người dùng", icon: Users },
      { href: "/roles", label: "Vai trò", icon: Shield },
      { href: "/suppliers", label: "Nhà cung cấp", icon: Store },
      { href: "/products", label: "Sản phẩm", icon: Package },
      { href: "/categories", label: "Danh mục", icon: Tag },
      { href: "/batches", label: "Lô hàng", icon: Boxes },
      { href: "/inventories", label: "Tồn kho", icon: Warehouse },
      { href: "/prices", label: "Giá bán", icon: Wallet },
      { href: "/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/shippers", label: "Giao hàng", icon: Truck },
      { href: "/complaints", label: "Khiếu nại", icon: AlertCircle },
      { href: "/customers", label: "Phân tích khách hàng", icon: PieChart },
      { href: "/greencreators", label: "Green Creator", icon: Image },
      { href: "/reports", label: "Báo cáo tài chính", icon: FileText },
      { href: "/settings/stores", label: "Các cửa hàng", icon: Building2 },
      { href: "/settings/store", label: "Cửa hàng của tôi", icon: Building2 },
    ],
  },
];
export default function AdminSidebar() {
  const path = usePathname();
  const role = asPortalRole(
    useAuthStore((s) => s.user?.role_name ?? s.session?.role_name),
  );
  return (
    <aside className="h-screen w-[260px] shrink-0 flex flex-col border-r border-emerald-100 bg-white">
      <div className="border-b border-emerald-50 px-6 py-5">
        <Link
          href="/dashboard"
          className="text-2xl font-black tracking-tight text-emerald-700"
        >
          Green<span className="text-lime-500">Plus</span>
        </Link>
        <p className="text-xs capitalize text-slate-500">
          Cổng {role ?? "quản trị"}
        </p>
      </div>
      <nav
        aria-label="Menu theo vai trò"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {role &&
          groups.map((group) => {
            const items = group.items.filter((item) =>
              canAccessPage(role, item.href),
            );
            return items.length ? (
              <div key={group.label}>
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      path === item.href ||
                      (item.href !== "/dashboard" &&
                        path.startsWith(item.href + "/"));
                    return (
                      <li key={item.href}>
                        <Link
                          aria-current={active ? "page" : undefined}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <Icon size={19} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null;
          })}
      </nav>
      <div className="border-t p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-emerald-50"
        >
          <Settings size={18} />
          Thông tin cá nhân
        </Link>
      </div>
    </aside>
  );
}
