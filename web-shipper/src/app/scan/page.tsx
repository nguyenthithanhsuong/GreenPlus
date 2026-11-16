import LazyScan from "../../frontend/scan/LazyScan";
import { requireShipperPage } from "../../server/require-page-session";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await requireShipperPage();
  return <LazyScan />;
}
