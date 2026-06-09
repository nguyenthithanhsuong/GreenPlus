class BetterStackLogger {
  private token = process.env.BETTER_STACK_SOURCE_TOKEN!;
  private url = "https://s2507495.eu-fsn-3.betterstackdata.com/logs";

  async send(payload: any) {
    await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.token,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: payload.level.toUpperCase(),
        message: payload.message,
        source: "app",
        context: payload.context || {},
      }),
    });
  }

  info(msg: string, context?: any) {
    void this.send({ level: "info", message: msg, context });
  }

  error(msg: string, context?: any) {
    void this.send({ level: "error", message: msg, context });
  }
}

export const logger = new BetterStackLogger();