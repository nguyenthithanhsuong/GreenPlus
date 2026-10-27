"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, BadgeCheck, CheckCircle2, Clock3, Home, KeyRound, HelpCircle,
  LoaderCircle, LogOut, Mail, Pencil, Phone, RefreshCw, ShieldCheck, Truck, UserRound,
} from "lucide-react";
import ShipperShell from "../shared/ShipperShell";
import Modal from "../shared/Modal";
import InfoRow from "../shared/InfoRow";
import type { Delivery } from "../../lib/delivery-types";

type Profile = { user_id: string; name: string; email: string; phone: string | null; address: string | null; status: string; image_url: string | null };
type Draft = { name: string; phone: string; address: string };

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: "", phone: "", address: "" });
  const [passwordDraft, setPasswordDraft] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [addressCheck, setAddressCheck] = useState<{address:string;latitude:number;longitude:number}|null>(null);
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const [me, orders] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/shipper/deliveries", { cache: "no-store" }),
      ]);
      if (me.status === 401 || orders.status === 401) { router.replace("/login"); return; }
      const [authData, orderData] = await Promise.all([me.json(), orders.json()]);
      if (!me.ok || !orders.ok) throw new Error(authData.error || orderData.error || "Không tải được hồ sơ");
      setUser(authData.user);
      setImageFailed(false);
      setDeliveries(Array.isArray(orderData.items) ? orderData.items : []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được hồ sơ"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  function startEdit() {
    if (!user) return;
    setDraft({ name: user.name, phone: user.phone || "", address: user.address || "" });
    setAddressCheck(null);setFormError(""); setEditing(true);
  }

  async function verifyAddress() {
    setCheckingAddress(true); setFormError("");
    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(draft.address)}`);
      const payload = await response.json() as {items?:Array<{address:string;latitude:number;longitude:number}>;error?:string};
      if (!response.ok || !payload.items?.length) throw new Error(payload.error || "Không xác minh được vị trí");
      setAddressCheck(payload.items[0]);
    } catch (error) { setAddressCheck(null);setFormError(error instanceof Error ? error.message : "Không xác minh được địa chỉ"); }
    finally {setCheckingAddress(false);}
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (draft.address.trim() && !addressCheck) {setFormError("Hãy xác minh địa chỉ liên hệ trước khi lưu.");return;}
    setSaving(true); setFormError("");
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error(result.error || "Không lưu được hồ sơ");
      setUser(result.user); setNotice("Đã cập nhật thông tin cá nhân."); setEditing(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Không lưu được hồ sơ"); }
    finally { setSaving(false); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (passwordDraft.newPassword !== passwordDraft.confirm) { setFormError("Mật khẩu xác nhận chưa khớp."); return; }
    setSaving(true); setFormError("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordDraft.currentPassword, newPassword: passwordDraft.newPassword }),
      });
      const result = await response.json();
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error(result.error || "Không đổi được mật khẩu");
      setPasswordDraft({ currentPassword: "", newPassword: "", confirm: "" });
      setNotice("Mật khẩu đã được thay đổi."); setChangingPassword(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Không đổi được mật khẩu"); }
    finally { setSaving(false); }
  }

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) throw new Error("Không thể đăng xuất. Vui lòng thử lại.");
      router.replace("/login"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể đăng xuất"); setConfirmLogout(false); }
    finally { setSigningOut(false); }
  }

  const completed = deliveries.filter((item) => item.status === "delivered").length;
  const inProgress = deliveries.filter((item) => item.status === "picked_up" || item.status === "delivering").length;
  const pending = deliveries.filter((item) => item.status === "assigned").length;
  const initials = user?.name?.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join("") || "GP";

  return (
    <ShipperShell title="Cá nhân" description="Hồ sơ và hoạt động giao hàng" icon={UserRound}
      action={<button type="button" aria-label="Tải lại hồ sơ" className="gp-icon-button" disabled={loading || refreshing} onClick={() => void load(true)}><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>}>
      {error && <div role="alert" className="gp-alert mb-4"><AlertCircle size={18} />{error}</div>}
      {notice && <div role="status" className="gp-success mb-4"><CheckCircle2 size={17} />{notice}</div>}
      <section className="gp-card overflow-hidden" aria-label="Tài khoản Shipper">
        <div className="h-20 bg-gradient-to-r from-[#115e59] via-[#209968] to-[#51b788]" aria-hidden="true" />
        <div className="px-4 pb-5">
          <div className="-mt-9 flex items-end justify-between gap-2">
            {user?.image_url?.trim() && !imageFailed ? (
              <img src={user.image_url} alt={`Ảnh đại diện của ${user.name}`}
                onError={() => setImageFailed(true)}
                className="h-[74px] w-[74px] shrink-0 rounded-full border-4 border-white bg-[#dcf5e5] object-cover" />
            ) : (
              <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#dcf5e5] text-2xl font-extrabold text-emerald-800">{initials}</div>
            )}
            <span className="gp-status gp-status-success mb-1"><BadgeCheck size={14} />{user?.status === "active" ? "Đang hoạt động" : loading ? "Đang xác minh" : "Shipper"}</span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-slate-800">{user?.name || (loading ? "Đang tải..." : "Shipper GreenPlus")}</h2>
          <p className="gp-muted mt-1 flex items-center gap-2"><Truck size={15} /> Nhân viên giao hàng GreenPlus</p>
          <button type="button" onClick={startEdit} disabled={!user} className="gp-primary-button mt-4 w-full"><Pencil size={16} /> Chỉnh sửa hồ sơ</button>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Thống kê đơn được phân công">
        {[
          { label: "Chờ lấy", value: pending, icon: Clock3, tone: "text-amber-700 bg-amber-50" },
          { label: "Đang giao", value: inProgress, icon: Truck, tone: "text-blue-700 bg-blue-50" },
          { label: "Đã giao", value: completed, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="gp-card min-w-0 p-3 text-center"><span className={`mx-auto inline-flex rounded-xl p-2 ${tone}`}><Icon size={17} /></span>
            <p className="mt-2 text-lg font-extrabold tabular-nums">{loading ? "—" : value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>
        ))}
      </div>

      <section className="gp-card mt-4 p-4" aria-label="Thông tin cá nhân">
        <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-extrabold"><UserRound size={18} className="text-emerald-700" /> Thông tin cá nhân</h2>
          <button type="button" onClick={startEdit} disabled={!user} className="text-xs font-bold text-emerald-700"><Pencil size={14} className="mr-1 inline" />Sửa</button></div>
        <dl className="mt-2">
          <InfoRow icon={UserRound} label="Họ và tên">{user?.name || "Chưa cập nhật"}</InfoRow>
          <InfoRow icon={Mail} label="Email đăng nhập (không thể sửa)">{user?.email || "Chưa cập nhật"}</InfoRow>
          <InfoRow icon={Phone} label="Số điện thoại">{user?.phone || "Chưa cập nhật"}</InfoRow>
          <InfoRow icon={Home} label="Địa chỉ liên hệ">{user?.address || "Chưa cập nhật"}</InfoRow>
          <InfoRow icon={ShieldCheck} label="Vai trò">Shipper — chỉ xem đơn được phân công</InfoRow>
        </dl>
      </section>

      <section className="gp-card mt-4 p-4" aria-label="Bảo mật tài khoản">
        <h2 className="flex items-center gap-2 font-extrabold"><ShieldCheck size={18} className="text-emerald-700" /> Tài khoản & bảo mật</h2>
        <p className="gp-muted mt-2">Thống kê dựa trên tối đa 100 đơn gần nhất. Thay đổi tên, số điện thoại, địa chỉ ngay trong ứng dụng.</p>
        <button type="button" className="gp-secondary-button mt-4 w-full" onClick={() => { setFormError(""); setChangingPassword(true); }}><KeyRound size={17} /> Đổi mật khẩu</button>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900"><HelpCircle size={18} className="mt-1 shrink-0" /> Để thay đổi email hoặc quyền Shipper, hãy liên hệ quản lý GreenPlus.</div>
        <button type="button" onClick={() => setConfirmLogout(true)} className="gp-danger-button mt-4 w-full"><LogOut size={17} /> Đăng xuất</button>
      </section>

      {editing && <Modal title="Chỉnh sửa hồ sơ" description="Cập nhật thông tin liên hệ" icon={Pencil} onClose={() => { if (!saving) setEditing(false); }} footer={
        <><button type="button" className="gp-secondary-button" disabled={saving} onClick={() => setEditing(false)}>Hủy</button>
          <button type="submit" form="gp-profile-edit" className="gp-primary-button" disabled={saving}>{saving && <LoaderCircle size={16} className="animate-spin" />} Lưu thay đổi</button></>}>
        <form id="gp-profile-edit" onSubmit={(event) => void saveProfile(event)} className="space-y-4">
          <div><label className="gp-label" htmlFor="gp-profile-name">Họ và tên</label><input id="gp-profile-name" className="gp-input" required minLength={2} maxLength={100} value={draft.name} onChange={(e) => setDraft((old) => ({ ...old, name: e.target.value }))} /></div>
          <div><label className="gp-label" htmlFor="gp-profile-phone">Số điện thoại</label><input id="gp-profile-phone" type="tel" className="gp-input" maxLength={20} value={draft.phone} onChange={(e) => setDraft((old) => ({ ...old, phone: e.target.value }))} placeholder="Ví dụ: 0901234567" /></div>
          <div><label className="gp-label" htmlFor="gp-profile-address">Địa chỉ liên hệ</label><textarea id="gp-profile-address" className="gp-input min-h-24 resize-y" maxLength={500} value={draft.address} onChange={(e) => {setDraft((old) => ({ ...old, address: e.target.value }));setAddressCheck(null);}} placeholder="Địa chỉ của bạn" /></div>
          <button type="button" onClick={() => void verifyAddress()} disabled={checkingAddress||!draft.address.trim()} className="gp-secondary-button w-full disabled:opacity-50">
            {checkingAddress ? "Đang xác minh..." : "Xác minh địa chỉ và tính tọa độ"}
          </button>
          {addressCheck && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
            {addressCheck.address}<br/>Latitude {addressCheck.latitude.toFixed(6)} · Longitude {addressCheck.longitude.toFixed(6)}
          </div>}
          <p className="text-xs text-slate-500">Khi tra cứu, địa chỉ liên hệ được gửi tới Photon công cộng · © OpenStreetMap contributors</p>
          {formError && <p role="alert" className="gp-alert"><AlertCircle size={17} />{formError}</p>}
          <p className="gp-muted">Email và quyền tài khoản do quản lý phụ trách.</p>
        </form>
      </Modal>}

      {changingPassword && <Modal title="Đổi mật khẩu" description="Bảo vệ tài khoản giao hàng của bạn" icon={KeyRound} onClose={() => { if (!saving) setChangingPassword(false); }} footer={
        <><button type="button" className="gp-secondary-button" disabled={saving} onClick={() => setChangingPassword(false)}>Hủy</button>
          <button type="submit" form="gp-change-password" disabled={saving} className="gp-primary-button">{saving && <LoaderCircle size={16} className="animate-spin" />} Đổi mật khẩu</button></>}>
        <form id="gp-change-password" onSubmit={(event) => void savePassword(event)} className="space-y-4">
          <div><label htmlFor="gp-old-password" className="gp-label">Mật khẩu hiện tại</label><input id="gp-old-password" className="gp-input" type="password" autoComplete="current-password" required value={passwordDraft.currentPassword} onChange={(e) => setPasswordDraft((s) => ({ ...s, currentPassword: e.target.value }))} /></div>
          <div><label htmlFor="gp-new-password" className="gp-label">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="gp-new-password" className="gp-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={passwordDraft.newPassword} onChange={(e) => setPasswordDraft((s) => ({ ...s, newPassword: e.target.value }))} /></div>
          <div><label htmlFor="gp-confirm-password" className="gp-label">Nhập lại mật khẩu mới</label><input id="gp-confirm-password" className="gp-input" type="password" autoComplete="new-password" required value={passwordDraft.confirm} onChange={(e) => setPasswordDraft((s) => ({ ...s, confirm: e.target.value }))} /></div>
          {formError && <p role="alert" className="gp-alert"><AlertCircle size={17} />{formError}</p>}
        </form>
      </Modal>}

      {confirmLogout && <Modal title="Xác nhận đăng xuất" description="Thoát phiên làm việc hiện tại" icon={LogOut} onClose={() => { if (!signingOut) setConfirmLogout(false); }}
        footer={<><button type="button" className="gp-secondary-button" disabled={signingOut} onClick={() => setConfirmLogout(false)}>Ở lại</button>
          <button type="button" className="gp-danger-button" disabled={signingOut} onClick={() => void logout()}>{signingOut ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />} Đăng xuất</button></>}>
        <p className="text-sm leading-6 text-slate-600">Bạn sẽ cần đăng nhập lại để xem danh sách giao hàng và hồ sơ.</p>
      </Modal>}
    </ShipperShell>
  );
}
