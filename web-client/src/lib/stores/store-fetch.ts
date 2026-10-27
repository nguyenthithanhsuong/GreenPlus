import { selectedStoreId } from "./store-selection";
/** Explicit fetch adapter for same-origin tenant-scoped commerce endpoints. */
export function storeFetch(input: string, init: RequestInit = {}) {
  if (!input.startsWith("/api/")) return fetch(input, init);
  const storeId = selectedStoreId();
  if (!storeId) {
    return Promise.reject(new Error("Vui lòng chọn cửa hàng trước khi xem sản phẩm hoặc thêm vào giỏ hàng."));
  }
  const url = new URL(input, window.location.origin);
  url.searchParams.set("storeId", storeId);
  let nextInit = init;
  if (typeof init.body === "string") {
    try {
      const data = JSON.parse(init.body);
      if (data && !Array.isArray(data) && typeof data === "object") {
        nextInit = { ...init, body: JSON.stringify({ ...data, storeId }) };
      }
    } catch {
      /* multipart and text requests are passed through without alteration */
    }
  }
  return fetch(url.pathname + url.search, nextInit);
}
