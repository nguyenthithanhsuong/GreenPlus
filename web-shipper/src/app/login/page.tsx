"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Eye,
  EyeOff,
  LockKeyhole,
  Leaf,
  LoaderCircle,
} from "lucide-react";
export default function ShipperLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Đăng nhập không thành công");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng nhập");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_20%_0%,#bbf7d0,#ecfdf5_45%,#f8fafc_100%)] px-4 py-10 text-slate-800">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_24px_100px_-40px_rgba(5,105,70,.6)]">
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-500 px-8 pb-10 pt-12 text-white">
          <div className="mb-8 inline-flex rounded-2xl bg-white/20 p-3">
            <Truck size={30} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            GreenPlus <span className="font-medium">Shipper</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-emerald-50">
            Đăng nhập để nhận và theo dõi các đơn giao được phân công.
          </p>
          <Leaf className="absolute right-7 top-8 opacity-25" size={90} />
        </div>
        <form onSubmit={submit} className="space-y-5 px-7 py-9">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email tài khoản Shipper
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="shipper@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-4 top-4 text-slate-500"
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy}
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <LockKeyhole size={18} />
            )}
            Đăng nhập
          </button>
          <p className="text-center text-xs text-slate-500">
            Chỉ dành cho tài khoản Shipper đã được quản lý cấp quyền.
          </p>
        </form>
      </section>
    </main>
  );
}
