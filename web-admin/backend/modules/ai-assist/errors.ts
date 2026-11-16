export class AiError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export function aiErrorResponse(error: unknown): Response {
  const status = error instanceof AiError ? error.status : (error instanceof Error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : 503);
  const message = status < 500 && error instanceof Error ? error.message : "Dịch vụ AI chưa khả dụng";
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
export function checkOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new AiError("Nguồn yêu cầu không hợp lệ", 403);
  if (request.method !== "GET" && !(request.headers.get("content-type") ?? "").startsWith("application/json"))
    throw new AiError("Dữ liệu JSON bắt buộc", 415);
  if (Number(request.headers.get("content-length") ?? "0") > 32000) throw new AiError("Dữ liệu quá lớn", 413);
}
