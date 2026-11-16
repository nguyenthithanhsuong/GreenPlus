export const ROLES: readonly string[];
export function canAi(role: string, ability: string): boolean;
export function hourlyLimit(role: string): number;
export function validUuid(value: unknown): value is string;
export function safeText(value: unknown, max?: number, min?: number): string | null;
export function assertSameStore(expected: string, actual: string): void;
