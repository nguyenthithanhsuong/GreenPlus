type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export class BetterStackLogger {
  constructor(private token: string, private url: string) {}

  async send(payload: LogPayload): Promise<void> {
    if (!this.token) {
      console.error("[BetterStack] Missing token");
      return;
    }
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
          message: payload.message,
          source: "app",
          context: payload.context ?? {},
        }),
      });

      const text = await response.text();
      console.log("[BetterStack]", response.status, text);
    } catch (err) {
      console.error("[BetterStack] NETWORK ERROR:", err);
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