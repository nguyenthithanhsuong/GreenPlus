"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type BatchOriginResult = {
  product_name: string;
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

function decodeWithJsQr(imageData: ImageData): string {
  const parsed = jsQR(imageData.data, imageData.width, imageData.height);
  return parsed?.data?.trim() ?? "";
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Inter', sans-serif",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  backLink: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  scannerSection: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A4331",
  },
  sectionHint: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "18px",
  },
  scanControls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  scanButton: {
    border: "none",
    borderRadius: "12px",
    background: "#51B788",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: "13px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  scanButtonAlt: {
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#1F2937",
    fontWeight: 700,
    fontSize: "13px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  videoPreview: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#F8FAFC",
    maxHeight: "220px",
    objectFit: "cover",
  },
  hiddenVideoPreview: {
    width: "1px",
    height: "1px",
    opacity: 0,
    position: "absolute",
    pointerEvents: "none",
  },
  inlineInputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
  },
  textInput: {
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
  },
  scanStatusText: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
  },
  scanErrorText: {
    margin: 0,
    fontSize: "12px",
    color: "#B91C1C",
  },
  resultCard: {
    borderRadius: "12px",
    border: "1px solid #D1FAE5",
    background: "#ECFDF5",
    padding: "10px",
    display: "grid",
    gap: "6px",
  },
  resultLine: {
    margin: 0,
    fontSize: "12px",
    color: "#065F46",
  },
};

export default function ProfileScanBatchPage() {
  const [batchIdInput, setBatchIdInput] = useState("");
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<BatchOriginResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [imageScanBusy, setImageScanBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<QrDetector | null>(null);

  const canUseBarcodeDetector = useMemo(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  }, []);

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

  const scanFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    setImageScanBusy(true);
    setScanError(null);
    setScanStatus("Đang đọc QR từ ảnh...");

    try {
      const bitmap = await createImageBitmap(file);
      let qrText = "";

      if (detectorRef.current) {
        const codes = await detectorRef.current.detect(bitmap);
        qrText = codes[0]?.rawValue?.trim() ?? "";
      }

      if (!qrText) {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          bitmap.close();
          throw new Error("Không thể đọc dữ liệu ảnh.");
        }

        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        qrText = decodeWithJsQr(imageData);
      }

      bitmap.close();

      if (!qrText) {
        setScanStatus(null);
        setScanError("Không tìm thấy mã QR trong ảnh vừa tải lên.");
        return;
      }

      await resolveQrText(qrText);
    } catch (requestError) {
      setScanStatus(null);
      setScanError(requestError instanceof Error ? requestError.message : "Không thể đọc QR từ ảnh.");
    } finally {
      setImageScanBusy(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/profile" style={styles.backLink} aria-label="Quay lại profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>Quét QR Batch</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.scannerSection}>
            <h2 style={styles.sectionTitle}>Tra cứu theo batch</h2>
            <p style={styles.sectionHint}>Quét bằng camera, tải ảnh QR, hoặc nhập trực tiếp batch ID để xem thông tin lô hàng.</p>

            <div style={styles.inlineInputRow}>
              <input
                type="text"
                value={batchIdInput}
                onChange={(event) => setBatchIdInput(event.target.value)}
                placeholder="Nhập batch ID"
                style={styles.textInput}
              />
              <button type="button" style={styles.scanButton} onClick={() => void fetchBatchInfo(batchIdInput)}>
                Tra cứu
              </button>
            </div>

            <div style={styles.scanControls}>
              {!cameraActive ? (
                <button type="button" style={styles.scanButton} onClick={() => void startCamera()}>
                  Mở camera
                </button>
              ) : (
                <>
                  <button type="button" style={styles.scanButton} onClick={() => void scanFromCamera()} disabled={cameraBusy}>
                    {cameraBusy ? "Đang quét..." : "Quét từ camera"}
                  </button>
                  <button type="button" style={styles.scanButtonAlt} onClick={stopCamera}>
                    Tắt camera
                  </button>
                </>
              )}

              <label style={styles.scanButtonAlt}>
                {imageScanBusy ? "Đang xử lý ảnh..." : "Tải ảnh QR"}
                <input type="file" accept="image/*" onChange={(event) => void scanFromImage(event)} style={{ display: "none" }} />
              </label>
            </div>

            <video ref={videoRef} muted playsInline style={cameraActive ? styles.videoPreview : styles.hiddenVideoPreview} />
            {!canUseBarcodeDetector && <p style={styles.scanStatusText}>BarcodeDetector không có sẵn, đang dùng chế độ quét dự phòng.</p>}
            {scanStatus && <p style={styles.scanStatusText}>{scanStatus}</p>}
            {scanError && <p style={styles.scanErrorText}>{scanError}</p>}

            {scanResult && (
              <div style={styles.resultCard}>
                <p style={styles.resultLine}><strong>Batch:</strong> {scanResult.batch_number}</p>
                <p style={styles.resultLine}><strong>Sản phẩm:</strong> {scanResult.product_name}</p>
                <p style={styles.resultLine}><strong>Nhà cung cấp:</strong> {scanResult.supplier_name ?? "Đang cập nhật"}</p>
                <p style={styles.resultLine}><strong>Nơi sản xuất:</strong> {scanResult.production_location ?? "Đang cập nhật"}</p>
                <p style={styles.resultLine}><strong>Ngày thu hoạch:</strong> {scanResult.harvest_date}</p>
                <p style={styles.resultLine}><strong>Hạn sử dụng:</strong> {scanResult.expire_date}</p>
                <p style={styles.resultLine}><strong>Chứng nhận:</strong> {scanResult.certification ?? "Không có"}</p>
              </div>
            )}
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
