import {normalizeDelivery, allowedTransition, safeOrderId} from './delivery-contract.mjs';
export class DeliveryApiError extends Error { constructor(message,status=502){super(message);this.status=status;} }
// Server-only adapter. The upstream MUST authenticate the Bearer token and enforce shipper ownership.
export function makeDeliveryApi({baseUrl,fetcher=fetch}) {
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new DeliveryApiError('GREENPLUS_SHIPPER_API_BASE_URL is not configured',503);
  const base = baseUrl.replace(/\/$/,'');
  async function request(path, token, method='GET', body) {
    if (!token || !/^Bearer [^\s]+$/.test(token)) throw new DeliveryApiError('Authentication required',401);
    let response;
    try {response = await fetcher(`${base}${path}`, {method,headers:{Authorization:token,...(body ? {'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
    catch {throw new DeliveryApiError('Delivery service unavailable',502);}
    if (!response.ok) throw new DeliveryApiError('Delivery service rejected request', [401,403,404,409,422].includes(response.status)?response.status:502);
    try {return await response.json();} catch {throw new DeliveryApiError('Invalid delivery service response',502);}
  }
  return {
    async list(token) {const payload=await request('/shipper/deliveries',token);if(!Array.isArray(payload.items)) throw new DeliveryApiError('Invalid list response');return payload.items.map(normalizeDelivery);},
    async update(token,id,current,next) {
      if(!safeOrderId(id)) throw new DeliveryApiError('Invalid order ID',400);
      if(!allowedTransition(current,next)) throw new DeliveryApiError('Invalid status transition',409);
      return normalizeDelivery(await request(`/shipper/deliveries/${encodeURIComponent(id)}/status`,token,'PATCH',{status:next}));
    }
  };
}
