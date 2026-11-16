export class AiUnavailableError extends Error {
  status: number;
  constructor(message?: string);
}
export function aiServiceEndpoint(): { base: URL; secret: string };
export function callAiService(operation: "forecast" | "promotion" | "chat" | "recipes" | "complaints", payload: Record<string, unknown>, options?: { timeoutMs?: number }): Promise<Record<string, unknown>>;
