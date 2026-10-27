export const TENANT_TABLES: Set<string>;
export function guardPostgrestRequest(
  url: string, init: RequestInit, scope: {storeIds: string[]} | null
): {url: string; init: RequestInit};
