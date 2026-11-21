type LogLevel = "debug" | "info" | "warning" | "error" | "critical";
interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}
const SENSITIVE =
  /password|token|secret|authorization|cookie|key|otp|email|phone|payload/i;
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE.test(key) ? "[REDACTED]" : sanitize(item),
      ]),
    );
  if (typeof value === "string")
    return value.length > 500 ? value.slice(0, 500) + "…" : value;
  return value;
}
export class BetterStackLogger {
  constructor(
    private token: string,
    private url: string,
  ) {}
  async send(payload: LogPayload): Promise<void> {
    if (typeof window !== "undefined" || !this.token || !this.url) return;
    // Only emit telemetry to a configured HTTPS ingestion endpoint.
    try {
      const destination = new URL(this.url);
      if (destination.protocol !== "https:" || destination.username || destination.password ||
          destination.search || destination.hash) return;
    } catch { return; }
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          dt: new Date().toISOString(),
          level: payload.level.toUpperCase(),
          message: payload.message.slice(0, 250),
          source: "greenplus",
          context: sanitize(payload.context ?? {}),
        }),
      });
      // A telemetry transport failure must not spawn another telemetry event.
      // Avoid printing the URL, token, message payload, or error details.
      void response.ok;
    } catch {
      // Logging must be best-effort and never affect the customer request.
    }
  }
  info(message: string, context?: Record<string, unknown>) {
    void this.send({ level: "info", message, context });
  }
  error(message: string, context?: Record<string, unknown>) {
    void this.send({ level: "error", message, context });
  }
  warn(message: string, context?: Record<string, unknown>) {
    void this.send({ level: "warning", message, context });
  }
  debug(message: string, context?: Record<string, unknown>) {
    void this.send({ level: "debug", message, context });
  }
  critical(message: string, context?: Record<string, unknown>) {
    void this.send({ level: "critical", message, context });
  }
}
