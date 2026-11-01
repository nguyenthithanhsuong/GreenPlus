"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";
import styles from "./login.module.css";

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
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng nhập không thành công");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng nhập");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark}><Leaf size={19} aria-hidden="true" /></span>
            <span className={styles.brandText}><strong>GreenPlus</strong><small>SHIPPER</small></span>
          </div>
          <Truck className={styles.headerTruck} size={22} aria-hidden="true" />
        </header>

        <div className={styles.content}>
          <div className={styles.welcome}>
            <span className={styles.welcomeMark}><Truck size={27} aria-hidden="true" /></span>
            <h1 className={styles.title}>Chào mừng Shipper!</h1>
            <p className={styles.subtitle}>Đăng nhập để quản lý những đơn giao hàng của bạn.</p>
          </div>

          <section className={styles.card} aria-label="Đăng nhập Shipper">
            <div className={styles.cardHeader}>
              <span className={styles.cardMark}><LockKeyhole size={20} aria-hidden="true" /></span>
              <div className={styles.cardHeading}>
                <p className={styles.kicker}>GREENPLUS SHIPPER</p>
                <h2 className={styles.cardTitle}>Đăng nhập</h2>
              </div>
            </div>

            <form className={styles.form} onSubmit={submit}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">Email tài khoản</label>
                <div className={styles.field}>
                  <Mail className={styles.fieldIcon} size={19} aria-hidden="true" />
                  <input
                    id="email"
                    className={styles.input}
                    type="email"
                    autoComplete="username"
                    placeholder="shipper@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">Mật khẩu</label>
                <div className={styles.field}>
                  <LockKeyhole className={styles.fieldIcon} size={19} aria-hidden="true" />
                  <input
                    id="password"
                    className={styles.input}
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityButton}
                    onClick={() => setVisible((value) => !value)}
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={visible}
                  >
                    {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className={styles.alert}>
                  <AlertCircle size={19} aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
              <button className={styles.submit} type="submit" disabled={busy}>
                {busy ? <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
                <span>{busy ? "Đang xác thực..." : "Đăng nhập"}</span>
              </button>
            </form>
          </section>
          <p className={styles.footnote}>
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Chỉ dành cho nhân viên giao hàng GreenPlus đã được cấp quyền.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
