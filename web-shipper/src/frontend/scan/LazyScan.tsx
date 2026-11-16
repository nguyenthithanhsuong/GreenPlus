"use client";

import dynamic from "next/dynamic";

const ScanScreen = dynamic(() => import("./Scan"), { ssr: false });

export default function LazyScan() {
  return <ScanScreen />;
}
