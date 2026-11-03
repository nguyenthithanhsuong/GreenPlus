import { cookies } from "next/headers";
import DockerCatalogWorkspace from "../../../frontend/settings/DockerCatalogWorkspace";
import ProductManagement from "../../../frontend/products/ProductManagement";

export default async function Page() {
  const storageMode = (await cookies()).get("greenplus_admin_storage_view")?.value;
  if (storageMode === "docker" && process.env.GREENPLUS_TENANCY_DEMO === "true") return <DockerCatalogWorkspace kind="catalog-products" />;
  return <ProductManagement />;
}
