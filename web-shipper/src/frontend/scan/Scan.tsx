"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Camera, CameraOff, ClipboardList, LoaderCircle, MapPin,
  Navigation2, ScanLine, Search, ShieldCheck, Wallet,
} from "lucide-react";
import ShipperShell from "../shared/ShipperShell";
import Modal from "../shared/Modal";
import StatusBadge from "../shared/StatusBadge";
import InfoRow from "../shared/InfoRow";
import type { Delivery } from "../../lib/delivery-types";
import dynamic from "next/dynamic";

const DeliveryMapPanel = dynamic(() => import("../map/DeliveryMapPanel"), { ssr: false });
type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export default function ScanScreen() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanningRef = useRef(false);
  const [active, setActive] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Delivery | null>(null);
  const [mapOrder, setMapOrder] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    scanningRef.current = false;
    setActive(false);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function lookup(value: string) {
    const orderId = value.trim().replace(/^greenplus:\/?\/?/i, "");
    if (!orderId) { setError("Vui lòng nhập mã đơn hàng cần tra cứu."); return; }
    stop(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/shipper/deliveries", { cache: "no-store" });
      if (response.status === 401) { router.replace("/login"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tải được danh sách đơn hàng");
      const candidates: Delivery[] = Array.isArray(data.items) ? data.items : [];
      const found = candidates.find((item) => item.order_id.toLowerCase() === orderId.toLowerCase());
      if (!found) throw new Error("Không tìm thấy đơn được phân công cho bạn với mã này.");
      setResult(found);
    } catch (e) { setError(e instanceof Error ? e.message : "Không tìm thấy đơn hàng"); }
    finally { setBusy(false); }
  }

  async function start() {
    setError("");
    try {
      const BarcodeDetector = (window as unknown as { BarcodeDetector?: new(options: { formats: string[] }) => Detector }).BarcodeDetector;
      if (!BarcodeDetector) { setError("Trình duyệt chưa hỗ trợ quét QR. Bạn vẫn có thể nhập mã đơn bên dưới."); return; }
      if (!navigator.mediaDevices?.getUserMedia) { setError("Camera không khả dụng. Bạn có thể nhập mã đơn thủ công."); return; }
      const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = camera;
      if (!video.current) { stop(); return; }
      video.current.srcObject = camera;
      setActive(true);
      await video.current.play();
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      timer.current = setInterval(async () => {
        if (scanningRef.current || !video.current) return;
        scanningRef.current = true;
        try {
          const rows = await detector.detect(video.current);
          if (rows[0]?.rawValue) { setCode(rows[0].rawValue); void lookup(rows[0].rawValue); }
        } catch { /* A single invalid camera frame is not a permanent error. */ }
        finally { scanningRef.current = false; }
      }, 450);
    } catch { stop(); setError("Không mở được camera. Hãy cấp quyền Camera hoặc nhập mã thủ công."); }
  }

  return (
    <ShipperShell title="Tra cứu mã đơn" description="Quét QR hoặc nhập mã của đơn hàng được phân công" icon={ScanLine}>
      <div className="space-y-4">
        <section className="gp-card overflow-hidden p-4" aria-label="Quét mã QR">
          <div className="mb-4 flex items-center gap-3"><span className="gp-heading-icon"><Camera size={21} /></span><div><h2 className="font-extrabold">Quét bằng camera</h2><p className="gp-muted">Đưa mã QR vào giữa khung hình</p></div></div>
          <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-900">
            <video ref={video} playsInline muted className={`h-full w-full object-cover ${active ? "block" : "hidden"}`} />
            {!active && <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-300"><CameraOff size={37} className="text-emerald-300" /><p className="text-sm font-semibold">Camera chưa được bật</p><p className="max-w-52 text-xs leading-5 text-slate-400">Nhấn nút bên dưới để bắt đầu quét mã</p></div>}
            {active && <div aria-hidden="true" className="pointer-events-none absolute inset-[18%_25%] rounded-2xl border-[3px] border-emerald-400/80 shadow-[0_0_0_999px_#020b1430]" />}
          </div>
          <button type="button" onClick={() => active ? stop() : void start()} className={`mt-4 w-full ${active ? "gp-secondary-button" : "gp-primary-button"}`}>
            {active ? <CameraOff size={18} /> : <Camera size={18} />}{active ? "Tắt camera" : "Bật camera quét mã"}
          </button>
          <p className="gp-muted mt-3 text-center text-xs">Camera yêu cầu quyền truy cập và kết nối HTTPS hoặc localhost.</p>
        </section>
        <section className="gp-card p-4" aria-label="Tra cứu thủ công">
          <div className="mb-5 flex items-center gap-3"><span className="gp-heading-icon"><Search size={21} /></span><div><h2 className="font-extrabold">Nhập mã thủ công</h2><p className="gp-muted">Không cần bật camera</p></div></div>
          <form onSubmit={(event) => { event.preventDefault(); void lookup(code); }}>
            <label className="gp-label" htmlFor="shipper-order-code">Mã đơn hàng</label>
            <input id="shipper-order-code" className="gp-input" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" placeholder="Nhập mã đơn được phân công" />
            <button disabled={busy} type="submit" className="gp-primary-button mt-4 w-full">
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />} Tra cứu đơn hàng
            </button>
          </form>
          {error && <div role="alert" className="gp-alert mt-4"><AlertCircle size={18} />{error}</div>}
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-900"><ShieldCheck size={18} /> Bảo mật đơn hàng</p>
            <p className="mt-2 text-xs leading-6 text-emerald-900/80">Bạn chỉ có thể tra cứu những đơn đã được hệ thống phân công. Mã của người khác sẽ không hiển thị thông tin khách hàng.</p>
          </div>
        </section>
      </div>
      {result && !mapOrder && (
        <Modal title="Chi tiết đơn tra cứu" description={`Mã #${result.order_id.slice(0, 8)}`} icon={ClipboardList} onClose={() => setResult(null)}
          footer={<><button type="button" className="gp-secondary-button" onClick={() => setResult(null)}>Đóng</button>
            <button type="button" className="gp-primary-button" onClick={() => setMapOrder(result.order_id)}><Navigation2 size={16} /> Bản đồ</button></>}>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f6faf7] p-4"><span className="text-sm font-bold text-slate-600">Trạng thái giao hàng</span><StatusBadge status={result.status} /></div>
          <dl className="mt-3">
            <InfoRow icon={ClipboardList} label="Mã đơn đầy đủ">{result.order_id}</InfoRow>
            <InfoRow icon={MapPin} label="Khách hàng & địa chỉ giao">{result.customer_name}<p className="gp-muted mt-1 font-normal">{result.delivery_address || "Chưa có địa chỉ giao hàng"}</p></InfoRow>
            <InfoRow icon={Wallet} label="Giá trị đơn">{money(result.total_amount)}</InfoRow>
          </dl>
        </Modal>
      )}
      {mapOrder && <DeliveryMapPanel orderId={mapOrder} onClose={() => { setMapOrder(null); setResult(null); }} />}
    </ShipperShell>
  );
}
