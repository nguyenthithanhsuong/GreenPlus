/** Navigation and route policy. The API must separately scope tenant-owned rows. */
export type PortalRole = "admin" | "manager" | "employee";
export const PORTAL_ROLES: readonly PortalRole[] = [
  "admin",
  "manager",
  "employee",
];
export function asPortalRole(value: unknown): PortalRole | null {
  return typeof value === "string" &&
    PORTAL_ROLES.includes(value.toLowerCase() as PortalRole)
    ? (value.toLowerCase() as PortalRole)
    : null;
}
export const ROLE_PAGES: Record<PortalRole, readonly string[]> = {
  admin: [
    "/dashboard",
    "/users",
    "/roles",
    "/greencreators",
    "/settings",
    "/settings/stores",
  ],
  manager: [
    "/dashboard",
    "/users",
    "/suppliers",
    "/products",
    "/categories",
    "/batches",
    "/inventories",
    "/prices",
    "/orders",
    "/shippers",
    "/complaints",
    "/customers",
    "/greencreators",
    "/reports",
    "/settings",
    "/settings/store",
  ],
  employee: [
    "/dashboard",
    "/suppliers",
    "/products",
    "/categories",
    "/batches",
    "/inventories",
    "/prices",
    "/orders",
    "/complaints",
    "/settings",
  ],
};
const parentFor = (path: string) => {
  if (path.startsWith("/settings/stores")) return "/settings/stores";
  if (path.startsWith("/settings/store")) return "/settings/store";
  if (path.startsWith("/settings")) return "/settings";
  return "/" + path.split("/").filter(Boolean)[0];
};
export function canAccessPage(role: PortalRole, pathname: string) {
  return ROLE_PAGES[role].includes(parentFor(pathname));
}
/** API deny-by-default for privileged admin routes; shipper API performs its own authentication. */
export function canAccessApi(role: PortalRole, path: string, method: string) {
  const domain = "/" + path.replace(/^\/api\//, "").split("/")[0];
  if (domain === "/permissions" || domain === "/health") return true;
  if (domain === "/shipper") return false;
  if (domain === "/roles" || domain === "/stores")
    return role === "admin" || (method === "GET" && role === "manager");
  if (domain === "/users") return role === "admin" || role === "manager";
  if (domain === "/greencreators")
    return role === "admin" || role === "manager";
  const page: Record<string, string> = {
    "/suppliers": "/suppliers",
    "/products": "/products",
    "/categories": "/categories",
    "/batches": "/batches",
    "/inventory": "/inventories",
    "/prices": "/prices",
    "/orders": "/orders",
    "/payments": "/orders",
    "/deliveries": "/shippers",
    "/complaints": "/complaints",
    "/reports": "/reports",
    "/storage": "/products",
    "/traceability": "/batches",
  };
  const target = page[domain];
  if (!target) return role === "admin";
  if (domain === "/deliveries" && role === "employee") return false;
  if (domain === "/reports" && role === "employee") return false;
  return canAccessPage(role, target);
}
