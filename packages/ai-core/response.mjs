export function apiFailure(error) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 503;
  return Response.json({error: status < 500 && error instanceof Error ? error.message : "Dịch vụ hiện không sẵn sàng"},
    {status,headers:{"Cache-Control":"no-store"}});
}
export function requireJsonOrigin(request) {
  if (request.method !== "GET") {
    const origin=request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw Object.assign(new Error("Nguồn yêu cầu không hợp lệ"),{status:403});
    if (!(request.headers.get("content-type")??"").startsWith("application/json"))
      throw Object.assign(new Error("Yêu cầu JSON"),{status:415});
    if (Number(request.headers.get("content-length")??0)>32000)
      throw Object.assign(new Error("Dữ liệu quá lớn"),{status:413});
  }
}

/** Read at most maxBytes from a JSON stream, including chunked requests without Content-Length.
 * Never trust Content-Length alone: an attacker may omit or falsify it. */
export async function readBoundedJson(request,{maxBytes=32_000}={}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1_048_576)
    throw Object.assign(new TypeError('Invalid JSON byte limit'),{status:500});
  requireJsonOrigin(request);
  if (Number(request.headers.get('content-length')??0) > maxBytes)
    throw Object.assign(new Error('Dữ liệu quá lớn'),{status:413});
  if (!request.body) throw Object.assign(new Error('Thiếu dữ liệu JSON'),{status:400});
  const reader=request.body.getReader();
  const parts=[];let bytes=0;
  try {
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      bytes+=value.byteLength;
      if (bytes>maxBytes) throw Object.assign(new Error('Dữ liệu quá lớn'),{status:413});
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(()=>{});
    throw error;
  } finally { reader.releaseLock(); }
  const raw=new Uint8Array(bytes);let offset=0;
  for (const part of parts) {raw.set(part,offset);offset+=part.byteLength;}
  try {
    const result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
    if(!result || typeof result!=='object' || Array.isArray(result))throw new SyntaxError('JSON object required');
    return result;
  } catch {
    throw Object.assign(new Error('Dữ liệu JSON không hợp lệ'),{status:400});
  }
}
