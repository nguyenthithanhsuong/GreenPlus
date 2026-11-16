import { redirect } from "next/navigation";
import { requireShipper, ShipperError } from "./shipper-auth";

export async function requireShipperPage(): Promise<void> {
  try {
    await requireShipper();
  } catch (error) {
    if (error instanceof ShipperError && (error.status === 401 || error.status === 403)) {
      redirect("/login");
    }
    throw error;
  }
}
