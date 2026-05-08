"use client";

import React from "react";
import { QrCode } from "lucide-react";
import { SCREEN_MAX_WIDTH_PX } from "../shared/screen.styles";

export default function ScanScreen() {
  return (
    <div
      className="min-h-screen bg-gray-50 pb-32 font-sans mx-auto relative"
      style={{ maxWidth: SCREEN_MAX_WIDTH_PX, width: "100%" }}
    >
      <div className="bg-[#129A48] pt-12 pb-24 text-center px-4">
        <h1 className="text-xl font-bold text-white">Quét QR / Mã vận đơn</h1>
      </div>

      <div className="px-4 -mt-16">
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-gray-100">
            <QrCode size={48} />
          </div>
          <p className="text-sm text-gray-600">Máy quét chưa được cấu hình. Nhấn bắt đầu để thử nghiệm.</p>
          <button className="mt-6 rounded-lg bg-[#15A651] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95">
            Bắt đầu quét
          </button>
        </div>
      </div>
    </div>
  );
}
