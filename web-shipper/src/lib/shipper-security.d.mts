export function verifyPassword(password: string, stored: string): Promise<boolean>;
export function hashPassword(password: string): Promise<string>;
