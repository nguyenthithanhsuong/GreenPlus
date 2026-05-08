import dynamic from "next/dynamic";

const ScanScreen = dynamic(() => import("../../frontend/scan/Scan"), { ssr: false });

export default function ScanPage() {
  return <ScanScreen />;
}
