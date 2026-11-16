const PATHS = new Set(["forecast", "promotion", "chat", "recipes", "complaints"]);

export class AiUnavailableError extends Error {
  constructor(message = "AI Assist chưa sẵn sàng") {
    super(message);
    this.status = 503;
  }
}

export function aiServiceEndpoint() {
  const configured = process.env.GREENPLUS_AI_SERVICE_URL?.trim();
  const secret = process.env.GREENPLUS_AI_SERVICE_KEY?.trim();
  if (!configured || !secret || Buffer.byteLength(secret) < 32)
    throw new AiUnavailableError("AI Assist chưa được cấu hình đủ thông tin máy chủ");
  const parsed = new URL(configured);
  const loopback = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  const docker = parsed.hostname === "ai-assist" && process.env.GREENPLUS_AI_DOCKER_INTERNAL === "true";
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/" ||
      (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && (loopback || docker))))
    throw new AiUnavailableError("Đường dẫn AI Assist không an toàn");
  return { base: parsed, secret };
}

export async function callAiService(operation, payload, options = {}) {
  if (!PATHS.has(operation)) throw new TypeError("Unknown AI operation");
  const { base, secret } = aiServiceEndpoint();
  let response;
  try {
    response = await fetch(new URL(`/v1/${operation}`, base), {
      method: "POST", redirect: "error", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-AI-Service-Key": secret },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(options.timeoutMs ?? 12000),
    });
  } catch {
    throw new AiUnavailableError("Không kết nối được AI Assist");
  }
  if (!response.ok) throw new AiUnavailableError(response.status === 422 ? "Dữ liệu không phù hợp với mô hình AI" : "AI Assist chưa thể xử lý yêu cầu");
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new AiUnavailableError("Phản hồi AI không hợp lệ");
  return data;
}
