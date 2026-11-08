import { cookies } from "next/headers";
import StoreManagement from "../../../../frontend/settings/StoreManagement";
import DockerTenantStoreManagement from "../../../../frontend/settings/DockerTenantStoreManagement";

// The admin's selected sandbox mode also applies to the Stores page.
// This does NOT mutate or copy the production Supabase store registry.
export default async function StoresPage() {
  const selected = (await cookies()).get("greenplus_admin_storage_view")?.value;
  if (selected === "docker" && process.env.GREENPLUS_TENANCY_DEMO === "true")
    return <DockerTenantStoreManagement />;
  return <StoreManagement />;
}
