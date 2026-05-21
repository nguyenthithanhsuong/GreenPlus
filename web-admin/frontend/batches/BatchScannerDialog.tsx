"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { Camera, FileSearch, Hash, ScanQrCode, X } from "lucide-react";

type BatchOriginResult = {
  product_id: string;
  product_name: string;
  image_url: string | null;
  supplier_name: string | null;
  production_location: string | null;
  harvest_date: string;
  expire_date: string;
  certification: string | null;
  batch_number: string;
};

type BarcodeResult = {
  rawValue?: string;
};

type QrDetector = {
  detect: (source: HTMLVideoElement | ImageBitmap) => Promise<BarcodeResult[]>;
};

type ScanMode = "batch" | "qr" | "camera";

type BatchScannerDialogProps = {
  open: boolean;
  initialMode: ScanMode;
  onClose: () => void;
};

const decodeWithJsQr = (imageData: ImageData): string => {
  const parsed = jsQR(imageData.data, imageData.width, imageData.height);
  return parsed?.data?.trim() ?? "";
};

const formatDate = (value: string): string => {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(parsed);
};

const BatchScannerDialog = ({ open, initialMode, onClose }: BatchScannerDialogProps) => {
  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [batchIdInput, setBatchIdInput] = useState("");
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<BatchOriginResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<QrDetector | null>(null);

  const canUseBarcodeDetector = useMemo(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(initialMode);
    setBatchIdInput("");
    setQrImageFile(null);
    setScanStatus(null);
    setScanError(null);
    setScanResult(null);
  }, [initialMode, open]);

  useEffect(() => {
    setCameraSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
    if (!canUseBarcodeDetector || typeof window === "undefined") {
      return;
    }

    const BarcodeDetectorCtor = (window as unknown as Window & {
      BarcodeDetector: new (config: { formats: string[] }) => QrDetector;
    }).BarcodeDetector;
    detectorRef.current = new BarcodeDetectorCtor({ formats: ["qr_code"] });
  }, [canUseBarcodeDetector]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraBusy(false);
    setScanStatus("Đã tắt camera.");
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open]);

  const fetchBatchInfo = async (batchId: string): Promise<void> => {
    const normalized = batchId.trim();
    if (!normalized) {
      setScanError("Vui lòng nhập batch ID.");
      return;
    }

    setScanStatus("Đang tra cứu batch...");
    setScanError(null);
    setScanResult(null);

    try {
      const response = await fetch(`/api/traceability/batch/${encodeURIComponent(normalized)}`);
      const data = (await response.json()) as BatchOriginResult | { error?: string };

      if (!response.ok) {
        const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
        throw new Error(message || "Không thể lấy thông tin batch.");
      }

      setScanResult(data as BatchOriginResult);
      setScanStatus("Đã tìm thấy thông tin batch.");
    } catch (requestError) {
      setScanStatus(null);
      setScanError(requestError instanceof Error ? requestError.message : "Không thể lấy thông tin batch.");
    }
  };

  const resolveQrText = async (rawQrText: string): Promise<void> => {
    const trimmed = rawQrText.trim();
    if (!trimmed) {
      setScanError("Không đọc được nội dung QR.");
      return;
    }

    setScanStatus("Đang giải mã QR...");
    setScanError(null);
    setScanResult(null);

    try {
      const response = await fetch("/api/traceability/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: trimmed }),
      });
      const data = (await response.json()) as BatchOriginResult | { error?: string };

      if (response.ok) {
        setScanResult(data as BatchOriginResult);
        setBatchIdInput((data as BatchOriginResult).batch_number);
        setScanStatus("Quét QR thành công.");
        return;
      }

      await fetchBatchInfo(trimmed);
    } catch (requestError) {
      setScanStatus(null);
      setScanError(requestError instanceof Error ? requestError.message : "Không thể quét QR.");
    }
  };

  const decodeQrFromImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Vui lòng chọn một file ảnh hợp lệ.");
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      const imageLoaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Không thể đọc ảnh QR."));
      });

      image.src = objectUrl;
      await imageLoaded;

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Không thể đọc dữ liệu ảnh QR.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      return decodeWithJsQr(imageData);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const resolveQrImage = async (): Promise<void> => {
    if (!qrImageFile) {
      setScanError("Vui lòng chọn ảnh QR.");
      return;
    }

    setScanStatus("Đang giải mã ảnh QR...");
    setScanError(null);
    setScanResult(null);

    try {
      const qrText = await decodeQrFromImageFile(qrImageFile);

      if (!qrText) {
        throw new Error("Không tìm thấy QR trong ảnh đã chọn.");
      }

      await resolveQrText(qrText);
    } catch (requestError) {
      setScanStatus(null);
      setScanError(requestError instanceof Error ? requestError.message : "Không thể giải mã ảnh QR.");
    }
  };

  const startCamera = async () => {
    if (!cameraSupported) {
      setScanError("Trình duyệt không hỗ trợ camera hoặc cần HTTPS/localhost để sử dụng camera.");
      return;
    }

    if (!videoRef.current) {
      setScanError("Khởi tạo camera thất bại. Thử tải lại trang.");
      return;
    }

    setScanError(null);
    setScanStatus("Đang mở camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setScanStatus("Camera đã sẵn sàng. Bấm 'Quét từ camera' để nhận diện.");
    } catch (requestError) {
      setScanStatus(null);
      if (requestError instanceof DOMException) {
        if (requestError.name === "NotAllowedError") {
          setScanError("Bạn chưa cấp quyền camera. Hãy cho phép camera trong trình duyệt.");
          return;
        }

        if (requestError.name === "NotFoundError") {
          setScanError("Không tìm thấy camera trên thiết bị.");
          return;
        }

        if (requestError.name === "NotReadableError") {
          setScanError("Camera đang được sử dụng bởi ứng dụng khác. Hãy đóng ứng dụng đó và thử lại.");
          return;
        }
      }

      setScanError(requestError instanceof Error ? requestError.message : "Không thể truy cập camera.");
    }
  };

  const scanFromCamera = async () => {
    if (!videoRef.current) {
      setScanError("Không thể quét từ camera trên thiết bị này.");
      return;
    }

    setCameraBusy(true);
    setScanError(null);
    try {
      let qrText = "";

      if (detectorRef.current) {
        const codes = await detectorRef.current.detect(videoRef.current);
        qrText = codes[0]?.rawValue?.trim() ?? "";
      }

      if (!qrText) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          throw new Error("Không thể đọc khung hình camera.");
        }

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        qrText = decodeWithJsQr(imageData);
      }

      if (!qrText) {
        setScanStatus("Không tìm thấy QR. Thử đưa QR vào giữa khung hình.");
        return;
      }

      await resolveQrText(qrText);
    } catch (requestError) {
      setScanError(requestError instanceof Error ? requestError.message : "Không thể quét từ camera.");
    } finally {
      setCameraBusy(false);
    }
  };

  if (!open) {
    return null;
  }

  const modes: Array<{ key: ScanMode; label: string; icon: typeof Hash }> = [
    { key: "batch", label: "Nhập batch ID", icon: Hash },
    { key: "qr", label: "Ảnh QR", icon: ScanQrCode },
    { key: "camera", label: "Quét camera", icon: Camera },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Đóng quét batch" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Quét lô hàng</p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">Tra cứu batch bằng QR, batch ID hoặc camera</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">Chọn một chế độ bên dưới, quét hoặc nhập mã, rồi xem chi tiết lô hàng ngay trong admin.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 lg:flex-row">
          <section className="flex-1 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-emerald-50/60 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {modes.map((item) => {
                const Icon = item.icon;
                const active = mode === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMode(item.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-emerald-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-4">
              {mode === "batch" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Batch ID</label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={batchIdInput}
                      onChange={(event) => setBatchIdInput(event.target.value)}
                      type="text"
                      placeholder="Nhập batch ID"
                      className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button type="button" onClick={() => void fetchBatchInfo(batchIdInput)} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                      Tra cứu
                    </button>
                  </div>
                </div>
              )}

              {mode === "qr" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Ảnh QR</label>
                  <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 bg-white p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setQrImageFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-600">
                        {qrImageFile ? `Đã chọn: ${qrImageFile.name}` : "Chọn ảnh chứa mã QR để giải mã."}
                      </p>
                      <button type="button" onClick={() => void resolveQrImage()} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                        Giải mã ảnh
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode === "camera" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {!cameraActive ? (
                      <button type="button" onClick={() => void startCamera()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                        <Camera className="h-4 w-4" />
                        Mở camera
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => void scanFromCamera()} disabled={cameraBusy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">
                          <FileSearch className="h-4 w-4" />
                          {cameraBusy ? "Đang quét..." : "Quét từ camera"}
                        </button>
                        <button type="button" onClick={stopCamera} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                          Tắt camera
                        </button>
                      </>
                    )}
                  </div>

                  <video ref={videoRef} muted playsInline className={cameraActive ? "w-full max-h-80 rounded-2xl border border-gray-200 bg-gray-100 object-cover" : "sr-only"} />
                  {!cameraSupported && <p className="text-sm text-amber-700">Trình duyệt không hỗ trợ camera hoặc cần HTTPS/localhost để dùng camera.</p>}
                  {!canUseBarcodeDetector && <p className="text-sm text-gray-500">BarcodeDetector không có sẵn, đang dùng chế độ quét dự phòng.</p>}
                </div>
              )}

              {scanStatus && <p className="text-sm text-gray-600">{scanStatus}</p>}
              {scanError && <p className="text-sm text-red-600">{scanError}</p>}
            </div>
          </section>

          <aside className="w-full shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm lg:w-[380px]">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Chi tiết lô hàng</h4>

            {scanResult ? (
              <div className="mt-4 space-y-4">
                {scanResult.image_url ? (
                  <img src={scanResult.image_url} alt={scanResult.product_name} className="h-48 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-emerald-100 text-sm text-emerald-700">Không có ảnh</div>
                )}

                <div>
                  <h5 className="text-lg font-bold text-emerald-950">{scanResult.product_name}</h5>
                  <p className="text-sm text-emerald-800">Batch: {scanResult.batch_number}</p>
                </div>

                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-xl bg-white/75 p-3">
                    <dt className="font-semibold text-emerald-700">Nhà cung cấp</dt>
                    <dd className="mt-1 text-emerald-950">{scanResult.supplier_name ?? "Đang cập nhật"}</dd>
                  </div>
                  <div className="rounded-xl bg-white/75 p-3">
                    <dt className="font-semibold text-emerald-700">Nơi sản xuất</dt>
                    <dd className="mt-1 text-emerald-950">{scanResult.production_location ?? "Đang cập nhật"}</dd>
                  </div>
                  <div className="rounded-xl bg-white/75 p-3">
                    <dt className="font-semibold text-emerald-700">Thu hoạch</dt>
                    <dd className="mt-1 text-emerald-950">{formatDate(scanResult.harvest_date)}</dd>
                  </div>
                  <div className="rounded-xl bg-white/75 p-3">
                    <dt className="font-semibold text-emerald-700">Hạn sử dụng</dt>
                    <dd className="mt-1 text-emerald-950">{formatDate(scanResult.expire_date)}</dd>
                  </div>
                  <div className="rounded-xl bg-white/75 p-3">
                    <dt className="font-semibold text-emerald-700">Chứng nhận</dt>
                    <dd className="mt-1 text-emerald-950">{scanResult.certification ?? "Không có"}</dd>
                  </div>
                </dl>

                <div className="flex gap-3">
                  <Link href={`/products?search=${encodeURIComponent(scanResult.product_name)}`} className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                    Mở sản phẩm
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-5 text-sm leading-6 text-emerald-800">
                Chưa có dữ liệu lô hàng. Dùng batch ID, QR text hoặc camera để tìm chi tiết.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BatchScannerDialog;