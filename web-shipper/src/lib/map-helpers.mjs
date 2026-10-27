/** Transport-neutral helpers, testable with Node without map or browser. */
export function validPoint(value) {
  if (!value || typeof value !== 'object' || typeof value.lat !== 'number' || typeof value.lng !== 'number') return false;
  return Number.isFinite(value.lat) && Number.isFinite(value.lng) && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
}
export function haversineKm(a, b) {
  if (!validPoint(a) || !validPoint(b)) return null;
  const r = Math.PI / 180;
  const dLat = (b.lat-a.lat)*r, dLon = (b.lng-a.lng)*r;
  const q = Math.sin(dLat/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));
}
export function convertOsrmResponse(raw) {
  const route = raw?.routes?.[0];
  const pts = route?.geometry?.coordinates;
  if (raw?.code !== 'Ok' || !Array.isArray(pts) || pts.length < 2 || pts.length > 25000 ||
      !Number.isFinite(route.distance) || !Number.isFinite(route.duration) || route.distance < 0 || route.duration < 0) return null;
  const points = pts.map(p => Array.isArray(p) && p.length >= 2 ? {lat:p[1],lng:p[0]} : null);
  if (points.some(p => !validPoint(p))) return null;
  return {points, distanceMeters:route.distance, durationSeconds:route.duration};
}
