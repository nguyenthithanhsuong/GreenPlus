/** Server-only API adapter. Never include credentials or session tokens in errors/logs. */
export class ShipperAuthUpstreamError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = 'ShipperAuthUpstreamError';
    this.code = code;
    this.status = status;
  }
}

export function resolveShipperApiBase(value, production = false) {
  const configured = typeof value === 'string' ? value.trim() : '';
  const candidate = configured || (production ? '' : 'http://localhost:3001/api');
  if (!candidate) throw new ShipperAuthUpstreamError(
    'SHIPPER_API_NOT_CONFIGURED',
    'Chưa cấu hình địa chỉ Web Admin API (GREENPLUS_SHIPPER_API_BASE_URL).', 503,
  );
  let url;
  try { url = new URL(candidate); }
  catch { throw new ShipperAuthUpstreamError('SHIPPER_API_BAD_URL', 'Địa chỉ Web Admin API không hợp lệ.', 503); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ShipperAuthUpstreamError('SHIPPER_API_BAD_URL', 'Địa chỉ Web Admin API không hợp lệ.', 503);
  }
  const path = url.pathname.replace(/\/+$/, '');
  if (path && path !== '/api') {
    throw new ShipperAuthUpstreamError(
      'SHIPPER_API_BAD_PATH',
      'GREENPLUS_SHIPPER_API_BASE_URL phải là địa chỉ Web Admin hoặc kết thúc bằng /api.', 503,
    );
  }
  // A common local misconfiguration is pointing Shipper's server proxy at itself.
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.port === '3002') {
    throw new ShipperAuthUpstreamError('SHIPPER_API_SELF_REFERENCE',
      'Web Shipper đang trỏ vào cổng 3002 của chính nó. Hãy dùng Web Admin API ở cổng 3001.', 503);
  }
  return `${url.origin}/api`;
}

async function jsonPayload(response) {
  try { return await response.json(); } catch { return null; }
}

export async function authenticateWithAdmin({ baseUrl, email, password, fetcher = fetch, timeoutMs = 12000 }) {
  const base = resolveShipperApiBase(baseUrl, true);
  let response;
  try {
    response = await fetcher(`${base}/shipper/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      redirect: 'manual', // Never send credentials to a redirected location.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new ShipperAuthUpstreamError(
      timeout ? 'SHIPPER_API_TIMEOUT' : 'SHIPPER_API_UNREACHABLE',
      timeout
        ? 'Web Admin API phản hồi quá lâu. Hãy kiểm tra máy chủ cổng 3001.'
        : 'Không kết nối được Web Admin API. Hãy chạy npm run dev:admin và kiểm tra cổng 3001.',
      502,
    );
  }
  if (response.status >= 300 && response.status < 400) {
    throw new ShipperAuthUpstreamError('SHIPPER_API_REDIRECT',
      'Web Admin API đang chuyển hướng thay vì trả JSON. Kiểm tra URL và middleware.', 502);
  }
  const payload = await jsonPayload(response);
  if (!response.ok) {
    if ([400, 401, 403, 422].includes(response.status)) {
      const safeError = typeof payload?.error === 'string' && payload.error.length <= 250
        ? payload.error : 'Không thể đăng nhập. Hãy kiểm tra tài khoản và vai trò Shipper.';
      throw new ShipperAuthUpstreamError('SHIPPER_AUTH_DENIED', safeError, response.status);
    }
    if (response.status === 404 || response.status === 405) {
      throw new ShipperAuthUpstreamError('SHIPPER_API_ROUTE_MISSING',
        'Không tìm thấy API Shipper trên Web Admin. Kiểm tra URL, cổng và phiên bản Web Admin.', 502);
    }
    throw new ShipperAuthUpstreamError('SHIPPER_API_UPSTREAM_ERROR',
      `Web Admin API lỗi HTTP ${response.status}. Xem Terminal web-admin để biết nguyên nhân.`, 502);
  }
  if (typeof payload?.session?.access_token !== 'string' || !payload.session.access_token ||
      !payload.user || typeof payload.user !== 'object' || Array.isArray(payload.user)) {
    throw new ShipperAuthUpstreamError('SHIPPER_API_INVALID_RESPONSE',
      'Web Admin API trả dữ liệu phiên đăng nhập không hợp lệ.', 502);
  }
  return { accessToken: payload.session.access_token, user: payload.user };
}
