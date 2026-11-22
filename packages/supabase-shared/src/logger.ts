type LogLevel = "debug" | "info" | "warning" | "error" | "critical";
interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}
const SENSITIVE =
  /password|token|secret|authorization|cookie|key|otp|email|phone|payload|address|session|request|body|user[_-]?id|actor[_-]?id|customer[_-]?id|card|cvv|iban/i;
function redactString(value: string): string {
  return value.slice(0,500)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?<!\d)(?:\+?84|0)[\s.-]?(?:\d[\s.-]?){9,10}(?!\d)/g, '[PHONE]')
    .replace(/https?:\/\/[^\s]+/gi, '[URL]');
}
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitize(item, depth + 1));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 30).map(([key, item]) => [
        key,
        SENSITIVE.test(key) ? "[REDACTED]" : sanitize(item, depth + 1),
      ]),
    );
  if (typeof value === "string") return redactString(value);
  return value;
}
export class BetterStackLogger {
  private readonly token: string;
  private readonly url: string;
  constructor(token: string, url: string) {
    this.token = token;
    this.url = url;
  }
  async send(payload: LogPayload): Promise<void> {
    if (typeof window !== "undefined" || !this.token || !this.url) return;
    // Avoid sending every read/list request to a paid third-party ingestion API.
    // Security/error events are never sampled. Info/debug are opt-in by env rate.
    const defaultRate = payload.level === "debug" ? 0 : 0.1;
    const rateText = process.env.BETTER_STACK_INFO_SAMPLE_RATE;
    const rate = rateText === undefined ? defaultRate : Math.max(0,Math.min(1,Number(rateText) || 0));
    if (["info", "debug"].includes(payload.level) && Math.random() >= rate) return;
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
        signal: AbortSignal.timeout(1500),
        redirect: "error",
        cache: "no-store",
        body: JSON.stringify({
          dt: new Date().toISOString(),
          level: payload.level.toUpperCase(),
          message: redactString(payload.message).slice(0, 250),
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
