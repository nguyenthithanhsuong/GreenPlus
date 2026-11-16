import Link from "next/link";
import { Building2, BrainCircuit, Shield, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import AdminShell from "../../../frontend/shared/AdminShell";
import StorageModeSetting from "../../../frontend/settings/StorageModeSetting";
import AiServiceStatus from "../../../frontend/settings/AiServiceStatus";

type Section = { href: string; title: string; description: string; icon: LucideIcon };
const sections: Section[] = [
  { href: "/settings/stores", title: "Cửa hàng trên nền tảng", description: "Quản lý tenant và trạng thái cửa hàng.", icon: Building2 },
  { href: "/users", title: "Tài khoản", description: "Quản lý người dùng theo phân quyền nền tảng.", icon: Users },
  { href: "/roles", title: "Vai trò và quyền", description: "Xem và quản lý vai trò của hệ thống.", icon: ShieldCheck },
  { href: "/greencreators", title: "Kiểm duyệt nội dung", description: "Rà soát nội dung trên nền tảng.", icon: Shield },
  { href: "/ai/chat", title: "Trợ lý và kho tri thức", description: "Hỗ trợ vận hành và tra cứu kiến thức đã duyệt.", icon: BrainCircuit },

];

export default function SystemPage() {
  return <AdminShell title="Hệ thống" description="Công cụ quản trị nền tảng dành riêng cho Admin.">
    <StorageModeSetting />
    <AiServiceStatus />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Chức năng hệ thống">
      {sections.map(({ href, title, description, icon: Icon }) => (
        <Link key={href} href={href} className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <span className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon size={22} aria-hidden="true" /></span>
          <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </Link>
      ))}
    </section>
  </AdminShell>;
}
