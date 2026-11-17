#!/usr/bin/env node
// Local-only diagnosis. Does not print secrets or write to AI/Supabase.
import { aiServiceEndpoint } from "../../packages/ai-core/ai-client.mjs";
const fail = (text) => { console.error(`[GreenPlus AI] ${text}`); process.exitCode = 1; };
let endpoint;
try { endpoint = aiServiceEndpoint(); }
catch { fail("CONFIG: Set GREENPLUS_AI_SERVICE_URL and 32+ byte GREENPLUS_AI_SERVICE_KEY in root .env.local."); process.exit(1); }
if (!["localhost","127.0.0.1"].includes(endpoint.base.hostname)) {
  fail("This diagnostic only probes a local AI service; production deployments are excluded."); process.exit(1);
}
try {
  const health = await fetch(new URL("/health",endpoint.base), { signal: AbortSignal.timeout(4000), redirect:"error" });
  if (!health.ok) { fail(`HEALTH: HTTP ${health.status}; inspect Docker logs.`); process.exit(1); }
  console.log("[GreenPlus AI] HEALTH PASS: local AI service responds.");
  const auth = await fetch(new URL("/v1/complaints",endpoint.base), { method:"POST", redirect:"error", signal:AbortSignal.timeout(6000),
    headers:{"Content-Type":"application/json","X-AI-Service-Key":endpoint.secret},
    body:JSON.stringify({store_id:"00000000-0000-4000-8000-000000000000",text:"Kiem tra ket noi AI"}) });
  if (auth.status === 401 || auth.status === 403) fail("AUTH FAIL: AI_SERVICE_KEY inside container differs from GREENPLUS_AI_SERVICE_KEY.");
  else if (!auth.ok) fail(`INFERENCE FAIL: HTTP ${auth.status}. Check AI container logs.`);
  else console.log("[GreenPlus AI] AUTH + INFERENCE PASS: local service key accepted.");
} catch { fail("NETWORK FAIL: Cannot reach AI service URL. Check Docker Compose and port 8100."); }
