export function apiFailure(error: unknown): Response;
export function requireJsonOrigin(request: Request): void;
export function readBoundedJson(request: Request, options?: {maxBytes?:number}): Promise<Record<string,unknown>>;
