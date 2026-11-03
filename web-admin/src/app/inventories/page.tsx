import { cookies } from "next/headers";
import DockerCommerceWorkspace from "../../../frontend/settings/DockerCommerceWorkspace";
import InventoryManagement from "../../../frontend/inventories/InventoryManagement";
export default async function Page() {
  const mode=(await cookies()).get("greenplus_admin_storage_view")?.value;
  if (mode === "docker" && process.env.GREENPLUS_TENANCY_DEMO === "true") return <DockerCommerceWorkspace kind="inventory"/>;
  return <InventoryManagement/>;
}
