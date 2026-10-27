export const SESSION_HOURS: number;
export function verifyPassword(password: string, stored: string): Promise<boolean>;
export function hashPassword(password: string): Promise<string>;
export function createShipperSession(userId: string, secret: string, now?: number): string;
export function verifyShipperSession(token: string | undefined, secret: string, now?: number): string | null;
