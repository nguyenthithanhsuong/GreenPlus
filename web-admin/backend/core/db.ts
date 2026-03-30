export type DbConfig = {
  url: string;
};

export function getDbConfig(): DbConfig {
  return {
    url: process.env.DATABASE_URL ?? "",
  };
}

export function assertDbConfig(config: DbConfig): void {
  if (!config.url) {
    throw new Error("DATABASE_URL is not configured");
  }
}
