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
} from "lucide-react";

const navGroups = [
  {
    label: "Tổng quan",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/users", label: "Người dùng", icon: Users },
      { href: "/roles", label: "Vai trò", icon: Shield },
      { href: "/suppliers", label: "Nhà cung cấp", icon: Store },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { href: "/products", label: "Sản phẩm", icon: Package },
      { href: "/categories", label: "Danh mục", icon: Tag },
      { href: "/batches", label: "Lô hàng", icon: Boxes },
      { href: "/inventories", label: "Tồn kho", icon: Warehouse },
      { href: "/prices", label: "Giá", icon: Wallet },
      { href: "/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/shippers", label: "Giao hàng", icon: Truck },
      { href: "/complaints", label: "Khiếu nại", icon: AlertCircle },
      { href: "/customers", label: "Phân tích khách hàng", icon: PieChart },
      { href: "/greencreators", label: "Kiểm duyệt nội dung", icon: Image },
      { href: "/reports", label: "Báo cáo tài chính", icon: FileText },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen bg-white border-r border-gray-100 flex flex-col font-sans shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-gray-50">
        <Link href="/dashboard" className="inline-flex" aria-label="GreenPlus dashboard">
          <img
            src="https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/General/IconText.png"
            alt="GreenPlus Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">{group.label}</h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-3 rounded-xl transition-colors ${
                        active
                          ? "text-[#059669] bg-[#F0FDF4] font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`w-[22px] h-[22px] mr-3 ${active ? "text-[#059669]" : "text-gray-800"}`} />
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/settings"
          className={`flex items-center px-3 py-3 rounded-xl transition-colors ${
            isRouteActive(pathname, "/settings")
              ? "text-[#059669] bg-[#F0FDF4] font-medium"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Settings className="w-[22px] h-[22px] mr-3" />
          <span className="text-[15px]">Cài đặt</span>
        </Link>
      </div>
    </aside>
  );
}
