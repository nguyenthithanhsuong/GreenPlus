/** A conservative, user-initiated location lookup, shared by the 3 Next.js servers.
 * Public Photon is for light development/demo use, NOT a production SLA.
 * Override GREENPLUS_GEOCODER_ORIGIN with a self-hosted Photon instance when scaling.
 */
export class LocationError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}
const cache = new Map();
let nextRequestAt = 0;
let queuedRequests = 0;
let requestQueue = Promise.resolve();
const normalize = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= 8 && latitude <= 24.5 && longitude >= 102 && longitude <= 110;
}
export function validStreetAddress(input) {
  const q = normalize(input);
  // Reject coarse city/province-only strings, arbitrary symbols and coordinates in lieu of an address.
  return q.length >= 12 && q.length <= 255 && /[\p{L}]/u.test(q) && /[\p{L}].{4,}[\s,].{3,}/u.test(q)
    && !/^[-\d.,\s]+$/.test(q) && !/[<>\u0000-\u001f]/.test(q);
}
function labelFor(p) {
  return [p.name, p.housenumber, p.street, p.locality, p.district, p.city, p.county, p.state, p.country]
    .filter(Boolean).filter((value, i, arr) => arr.indexOf(value) === i).join(', ');
}
function acceptable(p) {
  // Street/house/POI is required; don't accept a province or ward centroid as the delivery address.
  return Boolean(p.street || p.housenumber || (p.name && ['house','building','amenity','shop','office','tourism'].includes(p.osm_key)));
}
export async function geocodeAddress(raw) {
  const address = normalize(raw);
  if (!validStreetAddress(address)) throw new LocationError('Nhập địa chỉ đầy đủ gồm số nhà/đường và phường, tỉnh/thành phố (12–255 ký tự).');
  const key = address.toLocaleLowerCase('vi');
  const previous = cache.get(key);
  if (previous && previous.expiry > Date.now()) return previous.data;
  const upstream = process.env.GREENPLUS_GEOCODER_ORIGIN || 'https://photon.komoot.io';
  let host;
  try { host = new URL(upstream); } catch { throw new LocationError('Cấu hình geocoder không hợp lệ',503); }
  if (!['https:','http:'].includes(host.protocol) || host.username || host.password || (host.protocol === 'http:' && !['localhost','127.0.0.1'].includes(host.hostname)))
    throw new LocationError('Cần geocoder HTTPS hoặc localhost',503);
  // Coalesce all searches in each Next.js worker. No autocomplete / user keystroke requests.
  const operation = async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    nextRequestAt = Date.now() + 1100;
    const url = new URL('/api/',host);
    url.searchParams.set('q', address);
    url.searchParams.set('limit','5');
    url.searchParams.set('lang','vi');
    const response = await fetch(url, {
      headers:{'User-Agent':'GreenPlus-Delivery-Geocoder/1.0 (Next.js server; OSM/Photon)'},
      signal:AbortSignal.timeout(9000),
      cache:'no-store'
    });
    if (!response.ok) throw new LocationError('Dịch vụ xác định tọa độ đang bận. Hãy thử lại.',503);
    const json = await response.json();
    const matches = (Array.isArray(json.features) ? json.features : []).flatMap(feature => {
      const coords = feature?.geometry?.coordinates;
      const p = feature?.properties || {};
      const lng = Number(coords?.[0]), lat = Number(coords?.[1]);
      if (!validCoordinates(lat,lng) || !acceptable(p)) return [];
      if (p.countrycode && String(p.countrycode).toLowerCase() !== 'vn') return [];
      const label = labelFor(p);
      if (!label || label.length < 10) return [];
      return [{address:label.slice(0,255),latitude:lat,longitude:lng,source:'photon'}];
    });
    if (matches.length === 0) throw new LocationError('Không tìm thấy địa chỉ đủ chi tiết tại Việt Nam. Hãy bổ sung số nhà/đường và khu vực hoặc thử địa chỉ khác.');
    return matches;
  };
  // Keep queue alive even after a failed request.
  if (queuedRequests >= 8) throw new LocationError("Hệ thống xác minh địa chỉ đang bận. Hãy thử lại sau.", 429);
  queuedRequests++;
  const task = requestQueue.then(operation).finally(() => { queuedRequests--; });
  requestQueue = task.catch(() => {});
  let results;
  try {results = await task;} catch (error) {
    if (error instanceof LocationError) throw error;
    throw new LocationError('Không thể xác minh địa chỉ lúc này. Không lưu tọa độ chưa xác thực.',503);
  }
  if (cache.size > 180) cache.clear();
  cache.set(key,{expiry: Date.now() + 30*60*1000, data: results});
  return results;
}
/** Always recompute on the server. Never trust lat/long supplied by the browser. */
export async function resolveDeliveryAddress(address) {
  const results = await geocodeAddress(address);
  return results[0];
}
