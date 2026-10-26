"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Phone, Mail, UserRound, ShieldCheck } from "lucide-react";
import NavigationBar from "../dashboard/NavigationBar";
export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.ok) setUser((await res.json()).user);
      })
      .catch(() => {});
  }, [router]);
  async function logout() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <main className="min-h-dvh bg-emerald-50 px-4 pb-28 pt-12 text-slate-800">
      <div className="mx-auto max-w-[540px]">
        <section className="rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
          <div className="mb-4 inline-flex rounded-2xl bg-white/20 p-3">
            <UserRound size={30} />
          </div>
          <h1 className="text-2xl font-black">
            {user?.name || "Hồ sơ Shipper"}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-emerald-50">
            <ShieldCheck size={16} />
            Tài khoản nhân viên giao hàng
          </p>
        </section>
        <div className="mt-5 space-y-3 rounded-3xl bg-white p-6 shadow-sm">
          <p className="flex items-center gap-3 text-sm">
            <Mail size={18} className="text-emerald-600" />
            {user?.email || "Đang tải..."}
          </p>
          <p className="flex items-center gap-3 text-sm">
            <Phone size={18} className="text-emerald-600" />
            {user?.phone || "Chưa cập nhật số điện thoại"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 font-semibold text-rose-600 shadow-sm"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
      <NavigationBar />
    </main>
  );
}
