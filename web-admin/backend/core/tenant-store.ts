import { AsyncLocalStorage } from "node:async_hooks";
export type TenantScope = {
  userId: string;
  role: "manager" | "employee";
  storeIds: string[];
};
const context = new AsyncLocalStorage<TenantScope | null>();
export const activeTenantScope = () => context.getStore() ?? null;
export const runTenantScope = <T>(
  scope: TenantScope | null,
  fn: () => Promise<T>,
) => context.run(scope, fn);
