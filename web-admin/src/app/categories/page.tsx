import { cookies } from "next/headers";
import DockerCatalogWorkspace from "../../../frontend/settings/DockerCatalogWorkspace";
import CategoryManagement from "../../../frontend/categories/CategoryManagement";

export default async function Page() {
  const storageMode = (await cookies()).get("greenplus_admin_storage_view")?.value;
  if (storageMode === "docker" && process.env.GREENPLUS_TENANCY_DEMO === "true") return <DockerCatalogWorkspace kind="categories" />;
  return <CategoryManagement />;
}
