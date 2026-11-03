import { cookies } from "next/headers";
import DockerCommerceWorkspace from "../../../frontend/settings/DockerCommerceWorkspace";
import OrderManagement from "../../../frontend/orders/OrderManagement";
export default async function Page() {
  const mode=(await cookies()).get("greenplus_admin_storage_view")?.value;
  if (mode === "docker" && process.env.GREENPLUS_TENANCY_DEMO === "true") return <DockerCommerceWorkspace kind="orders"/>;
  return <OrderManagement/>;
}
