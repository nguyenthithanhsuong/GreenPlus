import { requireCustomerPage } from "../../../backend/core/require-customer-page";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function CustomerPageLayout({ children }: { children: ReactNode }) {
  await requireCustomerPage();
  return <>{children}</>;
}
