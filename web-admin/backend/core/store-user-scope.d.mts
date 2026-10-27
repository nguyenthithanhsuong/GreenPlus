export declare function storeUserRoleAllowed(role: Record<string, unknown> | null | undefined): boolean;
export declare function assignedStoreMap(storeIds: string[], members: Array<{user_id: string; store_id: string}>, orders: Array<{user_id: string; store_id: string}>, deliveries: Array<{employee_id: string; store_id: string}>, defaults: Array<{user_id: string; store_id: string}>): Map<string, Set<string>>;
export declare function publicStoreIds(map: Map<string, Set<string>>, userId: string): string[];
