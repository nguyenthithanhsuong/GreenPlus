/** Shared, server-only address lookup. Lookups are explicit user actions; no autocomplete.
 * Photon and the public Nominatim fallback are suitable for low-volume testing only.
 * For production provide GREENPLUS_GEOCODER_ORIGIN (self-hosted Photon), and optionally
 * GREENPLUS_GEOCODER_FALLBACK_ORIGIN (self-hosted Nominatim), or set fallback to "off".
 */
export class LocationError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}

const cache = new Map();
const inflight = new Map();
let nextRequestAt = 0;
let queuedRequests = 0;
let requestQueue = Promise.resolve();
const normalize = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= 8 && latitude <= 24.5 && longitude >= 102 && longitude <= 110;
}
export function validStreetAddress(input) {
  const q = normalize(input);
  return q.length >= 12 && q.length <= 255 && /[\p{L}]/u.test(q) && /[\p{L}].{4,}[\s,].{3,}/u.test(q)
    && !/^[-\d.,\s]+$/.test(q) && !/[<>\u0000-\u001f]/.test(q);
}
function labelFor(p) {
  return [p.name, p.housenumber, p.street, p.locality, p.district, p.city, p.county, p.state, p.country]
    .filter(Boolean).filter((value, i, arr) => arr.indexOf(value) === i).join(', ');
}
function acceptable(p) {
  // Photon can return a city centroid for a full address. Exclude these.
  return Boolean(p.street || p.housenumber ||
    (p.name && ['house','building','amenity','shop','office','tourism'].includes(p.osm_key)));
}
function parsePhoton(json) {
  return (Array.isArray(json?.features) ? json.features : []).flatMap(feature => {
    const p = feature?.properties || {};
    const lng = Number(feature?.geometry?.coordinates?.[0]);
    const lat = Number(feature?.geometry?.coordinates?.[1]);
    if (!validCoordinates(lat, lng) || !acceptable(p)) return [];
    if (p.countrycode && String(p.countrycode).toLowerCase() !== 'vn') return [];
    const label = labelFor(p);
    if (label.length < 10) return [];
    return [{address:label.slice(0,255), latitude:lat, longitude:lng, source:'photon'}];
  });
}
function parseNominatim(json) {
  return (Array.isArray(json) ? json : []).flatMap(row => {
    const lat = Number(row?.lat), lng = Number(row?.lon);
    const a = row?.address || {};
    const country = String(a.country_code || '').toLowerCase();
    const street = a.road || a.pedestrian || a.residential || a.footway || a.path;
    const detailed = Boolean(street || a.house_number ||
      (row.type && ['house','building','residential','apartments','shop','office','supermarket'].includes(row.type)));
    if (!validCoordinates(lat,lng) || country !== 'vn' || !detailed) return [];
    const label = normalize(row.display_name);
    if (label.length < 10) return [];
    return [{address:label.slice(0,255),latitude:lat,longitude:lng,source:'nominatim'}];
  });
}
function validatedOrigin(input, kind) {
  let url;
  try { url = new URL(input); } catch { throw new LocationError(`Cấu hình ${kind} không hợp lệ`, 503); }
  if (url.username || url.password || url.search || url.hash ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) {
    throw new LocationError(`Cấu hình ${kind} phải là HTTPS hoặc localhost, không có credentials/query`, 503);
  }
  return url;
}
async function throttledFetch(url, label) {
  const delay = Math.max(0, nextRequestAt - Date.now());
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  // Single queue per Node worker, 1 request / 1200 ms. Public-provider limits
  // are per deployed app, not per worker; production must self-host/use a paid SLA.
  nextRequestAt = Date.now() + 1200;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GreenPlus-Grocery-AddressLookup/1.0 (server-side; user-initiated)',
      'Accept': 'application/json',
      'Accept-Language': 'vi,en;q=0.7',
    },
    signal: AbortSignal.timeout(7000),
    cache:'no-store',
  });
  if (!response.ok) {
    const reason = response.status === 429 ? 'giới hạn truy vấn' : `HTTP ${response.status}`;
    throw new LocationError(`${label}: ${reason}`, 503);
  }
  return response.json();
}
async function lookup(address) {
  let photonResults = [];
  let photonFailure;
  try {
    const origin = validatedOrigin(process.env.GREENPLUS_GEOCODER_ORIGIN || 'https://photon.komoot.io', 'Photon');
    const url = new URL('/api/', origin);
    url.searchParams.set('q',address);
    url.searchParams.set('limit','5');
    url.searchParams.set('lang','vi');
    url.searchParams.set('countrycode','VN');
    photonResults = parsePhoton(await throttledFetch(url, 'Photon'));
  } catch (error) {
    photonFailure = error;
  }
  if (photonResults.length) return photonResults;

  // When Photon is unavailable or cannot match a Vietnamese address, try a second
  // backend. Can be swapped/disabled without rebuilding the app. Only execute as
  // part of an explicit lookup, never for every typed character.
  const fallback = process.env.GREENPLUS_GEOCODER_FALLBACK_ORIGIN ?? 'https://nominatim.openstreetmap.org';
  if (fallback === 'off') {
    if (photonFailure) throw new LocationError('Photon hiện không phản hồi. Cần cấu hình geocoder dự phòng hoặc thử lại.', 503);
    throw new LocationError('Không tìm thấy địa chỉ đủ chi tiết. Hãy bổ sung số nhà, tên đường và phường/xã.');
  }
  try {
    const origin = validatedOrigin(fallback, 'geocoder dự phòng');
    const url = new URL('/search', origin);
    url.searchParams.set('q',address);
    url.searchParams.set('format','jsonv2');
    url.searchParams.set('addressdetails','1');
    url.searchParams.set('countrycodes','vn');
    url.searchParams.set('limit','5');
    const results = parseNominatim(await throttledFetch(url, 'OpenStreetMap Nominatim'));
    if (results.length) return results;
    throw new LocationError('Không tìm thấy vị trí chi tiết phù hợp tại Việt Nam. Thử địa chỉ có số nhà, đường, phường và tỉnh/thành phố.', 422);
  } catch (error) {
    if (error instanceof LocationError && error.status === 422) throw error;
    throw new LocationError('Hai dịch vụ tra cứu đang không khả dụng hoặc bị giới hạn. Hãy thử lại sau; không thể lưu địa chỉ khi chưa xác minh được tọa độ.',503);
  }
}
export async function geocodeAddress(raw) {
  const address = normalize(raw);
  if (!validStreetAddress(address)) throw new LocationError('Nhập địa chỉ đủ số nhà/đường, phường/xã và tỉnh/thành phố (12–255 ký tự).');
  const key = address.toLocaleLowerCase('vi');
  const previous = cache.get(key);
  if (previous && previous.expiry > Date.now()) return previous.data;
  if (inflight.has(key)) return inflight.get(key);
  if (queuedRequests >= 8) throw new LocationError('Đang có quá nhiều lượt xác minh. Hãy thử lại sau.',429);
  queuedRequests++;
  const task = requestQueue.then(() => lookup(address));
  requestQueue = task.catch(() => {});
  const resultPromise = task.then(data => {
    if (cache.size >= 180) cache.clear();
    cache.set(key,{data,expiry:Date.now() + 24*60*60*1000});
    return data;
  }).finally(() => { queuedRequests--; inflight.delete(key); });
  inflight.set(key,resultPromise);
  return resultPromise;
}
export async function resolveDeliveryAddress(address, hint) {
  const results = await geocodeAddress(address);
  if (!hint) return results[0];
  const lat = hint.latitude, lng = hint.longitude;
  if (!validCoordinates(lat, lng)) throw new LocationError('Tọa độ được chọn không hợp lệ. Hãy xác minh lại địa chỉ.');
  const match = results.find(item => Math.abs(item.latitude - lat) < 0.00001 && Math.abs(item.longitude - lng) < 0.00001);
  if (!match) throw new LocationError('Vị trí đã chọn không khớp kết quả xác minh hiện tại. Hãy tìm lại địa chỉ.');
  return match;
}
