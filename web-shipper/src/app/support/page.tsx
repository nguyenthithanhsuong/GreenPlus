import ShipperSupport from "../../frontend/ai/ShipperSupport";
import { requireShipperPage } from "../../server/require-page-session";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireShipperPage();
  return <ShipperSupport />;
}
