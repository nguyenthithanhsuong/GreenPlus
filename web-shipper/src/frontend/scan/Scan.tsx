"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  Camera,
  Search,
  MapPin,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import NavigationBar from "../dashboard/NavigationBar";
import type { Delivery } from "../../lib/delivery-types";

type BarcodeDetectorType = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};
export default function ScanScreen() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [active, setActive] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Delivery | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function stop() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setActive(false);
  }
  useEffect(() => () => stop(), []);
  async function lookup(value: string) {
    const orderId = value.trim().replace(/^greenplus:\/?\/?/i, "");
    if (!orderId) {
      setError("Nhập mã đơn hàng cần tìm");
      return;
    }
    stop();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/shipper/deliveries", {
        cache: "no-store",
      });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Không tải được danh sách đơn");
      const found = (data.items as Delivery[]).find(
        (item) => item.order_id.toLowerCase() === orderId.toLowerCase(),
      );
      if (!found)
        throw new Error(
          "Không tìm thấy đơn được phân công cho bạn với mã này.",
        );
      setResult(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tìm thấy đơn");
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setError("");
    try {
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (options: {
            formats: string[];
          }) => BarcodeDetectorType;
        }
      ).BarcodeDetector;
      if (!Detector) {
        setError(
          "Trình duyệt chưa hỗ trợ đọc QR trực tiếp. Hãy nhập mã đơn thủ công.",
        );
        return;
      }
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      stream.current = camera;
      if (!video.current) {
        stop();
        return;
      }
      video.current.srcObject = camera;
      await video.current.play();
      setActive(true);
      const detector = new Detector({ formats: ["qr_code"] });
      let scanning = false;
      timer.current = setInterval(async () => {
        if (scanning || !video.current) return;
        scanning = true;
        try {
          const rows = await detector.detect(video.current);
          if (rows[0]?.rawValue) {
            setCode(rows[0].rawValue);
            void lookup(rows[0].rawValue);
          }
        } catch {
          /* transient frame errors are expected */
        } finally {
          scanning = false;
        }
      }, 450);
    } catch {
      stop();
      setError(
        "Không mở được camera. Hãy cấp quyền Camera hoặc nhập mã thủ công.",
      );
    }
  }
  return (
    <main className="min-h-dvh bg-emerald-50 px-4 pb-28 pt-10 text-slate-800">
      <div className="mx-auto max-w-[540px]">
        <header className="rounded-3xl bg-gradient-to-br from-emerald-700 to-lime-500 p-7 text-white shadow-lg">
          <ScanLine size={35} />
          <h1 className="mt-3 text-2xl font-black">Tra cứu mã đơn</h1>
          <p className="mt-2 text-sm text-emerald-50">
            Chỉ tra cứu những đơn hàng đã được phân công cho bạn.
          </p>
        </header>
        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <div className="overflow-hidden rounded-2xl bg-slate-900">
            <video
              ref={video}
              playsInline
              muted
              className={`h-52 w-full object-cover ${active ? "block" : "hidden"}`}
            />
            {!active && (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-white/80">
                <Camera size={40} />
                <span className="text-sm">Camera đang tắt</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => (active ? stop() : void start())}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white"
          >
            <Camera size={18} />
            {active ? "Tắt camera" : "Quét mã QR"}
          </button>
          <p className="my-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hoặc nhập mã đơn
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(code);
            }}
            className="flex gap-2"
          >
            <input
              aria-label="Mã đơn hàng"
              placeholder="Mã đơn hàng"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <button
              disabled={busy}
              type="submit"
              aria-label="Tìm đơn"
              className="rounded-xl bg-emerald-600 p-3 text-white disabled:opacity-50"
            >
              <Search />
            </button>
          </form>
          {error && (
            <p
              role="alert"
              className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
            >
              <AlertCircle size={18} />
              {error}
            </p>
          )}
          {result && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="flex gap-2 font-bold">
                <PackageCheck className="text-emerald-700" />#
                {result.order_id.slice(0, 8)}
              </p>
              <p className="mt-2 text-sm">{result.customer_name}</p>
              <p className="mt-2 flex gap-2 text-sm text-slate-600">
                <MapPin size={18} />
                {result.delivery_address}
              </p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">
                Trạng thái: {result.status}
              </p>
            </div>
          )}
        </section>
        <NavigationBar />
      </div>
    </main>
  );
}
