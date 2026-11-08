/** Non-destructive bootstrap for the local Docker lab; never prints secrets. */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";

const randomToken = () => randomBytes(36).toString("hex");
function findValue(content, key) {
  const matches = [...content.matchAll(new RegExp(`^\\s*${key}\\s*=([^\\r\\n]*)`, "gm"))];
  if (matches.length !== 1) throw new Error(`Missing or duplicated ${key} in Docker .env`);
  return matches[0][1].trim();
}
export function ensureDockerSecrets(file, makeToken = randomToken) {
  if (!existsSync(file)) {
    const postgres = makeToken();
    const gateway = makeToken();
    const rest = makeToken();
    writeFileSync(file, `# Local Docker sandbox ONLY. Never commit.\nDEMO_POSTGRES_PASSWORD=${postgres}\nDEMO_GATEWAY_KEY=${gateway}\nDEMO_POSTGREST_PASSWORD=${rest}\n`, { mode: 0o600, flag: "wx" });
    return { created: true, addedRestPassword: true };
  }
  const content = readFileSync(file, "utf8");
  for (const key of ["DEMO_POSTGRES_PASSWORD", "DEMO_GATEWAY_KEY"]) {
    const value = findValue(content, key);
    if (!value || value.startsWith("replace-with-"))
      throw new Error(`Existing Docker .env has an empty or placeholder ${key}; update it manually`);
  }
  if (new RegExp("^\\s*DEMO_POSTGREST_PASSWORD\\s*=", "m").test(content)) {
    const value = findValue(content, "DEMO_POSTGREST_PASSWORD");
    if (!/^[A-Za-z0-9_-]{32,}$/.test(value) || value.startsWith("replace-with-"))
      throw new Error("DEMO_POSTGREST_PASSWORD must be a 32+ character URL-safe secret");
    return { created: false, addedRestPassword: false };
  }
  // Append only the new secret; never overwrite the existing PostgreSQL/gateway keys.
  const newSecret = makeToken();
  if (!/^[A-Za-z0-9_-]{32,}$/.test(newSecret))
    throw new Error("Generated PostgREST secret is not URL-safe");
  appendFileSync(file, `${content.endsWith("\n") ? "" : "\n"}DEMO_POSTGREST_PASSWORD=${newSecret}\n`, { mode: 0o600 });
  return { created: false, addedRestPassword: true };
}
