export class ShipperAuthUpstreamError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status?: number);
}
export function resolveShipperApiBase(value: string | undefined, production?: boolean): string;
export function authenticateWithAdmin(args: {
  baseUrl: string;
  email: string;
  password: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ accessToken: string; user: Record<string, unknown> }>;
