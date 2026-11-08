export type DockerGatewayConfiguration =
  | { configured: false; reason: string }
  | { configured: true; mode: "local" | "internal" | "remote"; url: string; key: string; accessId: string; accessSecret: string };
export declare class DockerGatewayError extends Error {
  status: number;
  constructor(message: string, status?: number);
}
export declare function dockerGatewayConfiguration(env?: NodeJS.ProcessEnv): DockerGatewayConfiguration;
export declare function fetchDockerGateway(path: string, options?: { method?: string; body?: unknown; timeoutMs?: number }, env?: NodeJS.ProcessEnv, fetcher?: typeof fetch): Promise<{ status: number; ok: boolean; data: unknown }>;
export declare function dockerGatewayReadiness(env?: NodeJS.ProcessEnv, fetcher?: typeof fetch): Promise<{ configured: boolean; ready: boolean; mode?: "local" | "internal" | "remote"; reason?: string }>;
