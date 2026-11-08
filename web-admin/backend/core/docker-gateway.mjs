/**
 * Server-only gateway configuration for the isolated Docker tenancy lab.
 * Never pass the gateway key or Access token to browser code or logs.
 * Remote access requires BOTH an HTTPS allowlisted hostname and an Access
 * service token. This does not turn the demo gateway into a production backend.
 */
const KEY_BYTES = 32;

export class DockerGatewayError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.name = "DockerGatewayError";
    this.status = status;
  }
}

export function dockerGatewayConfiguration(env = process.env) {
  const unavailable = (reason) => ({ configured: false, reason });
  if (env.GREENPLUS_TENANCY_DEMO !== "true") return unavailable("Docker tenancy is disabled");
  const key = env.GREENPLUS_DOCKER_GATEWAY_KEY ?? "";
  if (Buffer.byteLength(key) < KEY_BYTES) return unavailable("Docker gateway key is missing or too short");
  const address = env.GREENPLUS_DOCKER_GATEWAY_URL;
  if (!address) return unavailable("Docker gateway URL is missing");
  let url;
  try { url = new URL(address); } catch { return unavailable("Invalid Docker gateway URL"); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    return unavailable("Docker gateway URL must have no credentials, path, query or fragment");
  // Trusted Docker bridge hostname, resolved ONLY on the privately shared
  // greenplus-three-tier_default network. Vercel cannot use this route.
  if (url.protocol === "http:" && url.hostname === "gateway" && url.port === "4100") {
    if (env.GREENPLUS_DOCKER_INTERNAL_ENABLED !== "true" || env.VERCEL === "1")
      return unavailable("Internal Docker gateway requires an explicit container-only setting");
    return { configured: true, mode: "internal", url: url.origin, key, accessId: "", accessSecret: "" };
  }
  const local = ["127.0.0.1", "localhost"].includes(url.hostname.toLowerCase());
  if (local) {
    if (url.protocol !== "http:" || url.port !== "4100")
      return unavailable("Local Docker must use http://127.0.0.1:4100");
    if (env.VERCEL === "1") return unavailable("Vercel cannot reach a localhost Docker gateway");
    return { configured: true, mode: "local", url: url.origin, key, accessId: "", accessSecret: "" };
  }
  if (url.protocol !== "https:" || url.port ||
      !/^(?=.{4,253}$)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) ||
      /(?:\.localhost|\.local|\.internal|\.invalid|\.test|\.example)$/i.test(url.hostname))
    return unavailable("Remote Docker must use a public DNS hostname over HTTPS");
  if (env.GREENPLUS_DOCKER_REMOTE_ENABLED !== "true")
    return unavailable("Remote Docker access must be explicitly enabled");
  if (!env.GREENPLUS_DOCKER_GATEWAY_HOST || env.GREENPLUS_DOCKER_GATEWAY_HOST.toLowerCase() !== url.hostname.toLowerCase())
    return unavailable("Remote Docker hostname does not match the allowlist");
  const accessId = env.GREENPLUS_DOCKER_ACCESS_CLIENT_ID ?? "";
  const accessSecret = env.GREENPLUS_DOCKER_ACCESS_CLIENT_SECRET ?? "";
  if (!accessId || !accessSecret)
    return unavailable("Remote Docker requires an Access service token");
  return { configured: true, mode: "remote", url: url.origin, key, accessId, accessSecret };
}

export async function fetchDockerGateway(path, options = {}, env = process.env, fetcher = fetch) {
  const config = dockerGatewayConfiguration(env);
  if (!config.configured) throw new DockerGatewayError(config.reason);
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || /[\\#]/.test(path))
    throw new DockerGatewayError("Invalid Docker gateway path", 400);
  const url = new URL(path, `${config.url}/`);
  if (url.origin !== config.url) throw new DockerGatewayError("Invalid Docker gateway destination", 400);
  const { method = "GET", body, timeoutMs = 10000 } = options;
  const headers = {
    "x-demo-gateway-key": config.key,
    ...(config.mode === "remote" ? {
      "CF-Access-Client-Id": config.accessId,
      "CF-Access-Client-Secret": config.accessSecret,
    } : {}),
    ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  };
  try {
    const response = await fetcher(url, {
      method, headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await response.json().catch(() => { throw new Error("Invalid JSON"); });
    return { status: response.status, ok: response.ok, data };
  } catch {
    // Never include URL, secret, body or network exception details in an HTTP response.
    throw new DockerGatewayError("Docker gateway is unreachable");
  }
}

export async function dockerGatewayReadiness(env = process.env, fetcher = fetch) {
  const config = dockerGatewayConfiguration(env);
  if (!config.configured) return { configured: false, ready: false, reason: config.reason };
  try {
    const response = await fetchDockerGateway("/ready", { timeoutMs: 3500 }, env, fetcher);
    if (!response.ok || response.data?.status !== "ready")
      return { configured: true, ready: false, mode: config.mode, reason: "Docker backend is not ready" };
    // /ready is public inside the lab. A successful readiness probe is NOT
    // sufficient to prove that the configured gateway key is accepted.
    const authenticated = await fetchDockerGateway("/stores", { timeoutMs: 3500 }, env, fetcher);
    if (!authenticated.ok || !Array.isArray(authenticated.data?.items))
      return { configured: true, ready: false, mode: config.mode, reason: "Docker authentication or catalog failed" };
    return { configured: true, ready: true, mode: config.mode };
  } catch {
    return { configured: true, ready: false, mode: config.mode, reason: "Docker gateway is unreachable" };
  }
}
