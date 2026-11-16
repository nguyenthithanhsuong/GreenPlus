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
