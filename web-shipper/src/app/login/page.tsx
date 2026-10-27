"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Leaf, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Truck } from "lucide-react";

export default function ShipperLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng nhập không thành công");
      router.replace("/"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể đăng nhập"); }
    finally { setBusy(false); }
  }

  return (
    <main className="gp-app">
      <div className="gp-phone-frame flex min-h-dvh flex-col">
        <header className="gp-topbar">
          <span className="gp-brand"><span className="gp-brand-icon"><Leaf size={19} /></span><span><strong>GreenPlus</strong><small>SHIPPER</small></span></span>
          <Truck size={21} className="text-[#51b788]" aria-hidden="true" />
        </header>
        <div className="flex flex-1 flex-col justify-center px-5 py-9">
          <div className="mb-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#e4f7eb] text-[#159553]"><Truck size={31} /></span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#184a33]">Chào mừng Shipper!</h1>
            <p className="gp-muted mx-auto mt-2 max-w-xs">Đăng nhập để quản lý những đơn giao hàng của bạn.</p>
          </div>
          <section className="gp-card p-5" aria-label="Đăng nhập Shipper">
            <div className="flex items-center gap-2"><span className="gp-heading-icon"><LockKeyhole size={20} /></span><div><p className="gp-kicker">GREENPLUS SHIPPER</p><h2 className="text-lg font-extrabold text-[#184a33]">Đăng nhập</h2></div></div>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div><label htmlFor="email" className="gp-label">Email tài khoản</label>
                <div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />
                  <input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="shipper@example.com" className="gp-input pl-11" /></div></div>
              <div><label htmlFor="password" className="gp-label">Mật khẩu</label>
                <div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />
                  <input id="password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="gp-input pl-11 pr-12" />
                  <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-emerald-50">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </div>
              </div>
              <div className="h-[84px] overflow-y-auto" aria-live="polite">{error && <p role="alert" className="gp-alert"><AlertCircle size={18} /> <span>{error}</span></p>}</div>
              <button type="submit" disabled={busy} className="gp-primary-button w-full py-3.5">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <LockKeyhole size={18} />} {busy ? "Đang xác thực..." : "Đăng nhập"}</button>
            </form>
          </section>
          <p className="gp-muted mt-5 flex items-start justify-center gap-2 text-center"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />Chỉ dành cho nhân viên giao hàng GreenPlus đã được cấp quyền.</p>
        </div>
        <footer className="px-4 pb-6 text-center text-[11px] text-slate-400">GreenPlus · Giao hàng xanh mỗi ngày</footer>
      </div>
    </main>
  );
}
