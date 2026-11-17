export const SESSION_HOURS: number;
export function sharedAuthSecret(env?: NodeJS.ProcessEnv): string;
export function createSharedShipperToken(user: {user_id: string; email: string}, secret: string, now?: number): string;
export function verifySharedShipperToken(token: string | undefined, secret: string, now?: number): string | null;
