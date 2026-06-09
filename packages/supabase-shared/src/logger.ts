class BetterStackLogger {
  private token: string;
  private url: string;

  constructor() {
    this.token = process.env.BETTER_STACK_SOURCE_TOKEN || "";
    this.url =
      process.env.BETTER_STACK_URL ||
      "https://s2507495.eu-fsn-3.betterstackdata.com/logs";

    if (!this.token) {
      console.error("[BetterStack] Missing token");
    }
  }

  async send(payload: {
    level: string;
    message: string;
    context?: any;
  }) {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.token,
        },
        body: JSON.stringify({
          dt: new Date().toISOString(),
          level: payload.level.toUpperCase(),
          message: payload.message,
          source: "app",
          context: payload.context || {},
        }),
      });

      const text = await response.text();

      console.log("[BetterStack]", response.status, text);
    } catch (err) {
      console.error("[BetterStack] NETWORK ERROR:", err);
    }
  }

  info(msg: string, context?: any) {
    void this.send({ level: "info", message: msg, context });
  }

  error(msg: string, context?: any) {
    void this.send({ level: "error", message: msg, context });
  }
}

export const logger = new BetterStackLogger();