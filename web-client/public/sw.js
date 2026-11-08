/* GreenPlus: network-first navigation and static offline shell only.
 * Never cache user sessions, cart, payment, location or delivery API responses. */
const CACHE = "greenplus-web-client-offline-v2";
const OFFLINE_URL = "/offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([
    OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"
  ])));
  // Intentionally don't skipWaiting(): user may be checking out/delivering.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("greenplus-web-client-") && key !== CACHE)
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match(OFFLINE_URL)) ||
    new Response("Đang ngoại tuyến", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  ));
});
