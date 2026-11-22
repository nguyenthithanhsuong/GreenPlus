import { resolveDeliveryAddress, LocationError } from '../../../../../../packages/location/index.mjs';
import { requireCustomerIdentity } from '../../../../../backend/core/request-auth';
import { resolveStoreContext } from '../../../../../backend/core/store-context';
import { shippingQuote } from '../../../../../backend/modules/shipping/shipping.service';
import { AppError } from '../../../../../backend/core/errors';
import { requireJsonOrigin } from '../../../../../../packages/ai-core/response.mjs';
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    requireJsonOrigin(request);
    const identity=requireCustomerIdentity(request);
    const input=await request.json() as {storeId?:string;deliveryAddress?:string};
    if(typeof input.deliveryAddress!=='string'||input.deliveryAddress.length<12||input.deliveryAddress.length>255)
      return Response.json({error:'Nhập địa chỉ giao hàng hợp lệ'}, {status:400});
    const store=await resolveStoreContext(input.storeId,identity);
    const location=await resolveDeliveryAddress(input.deliveryAddress);
    const quote=await shippingQuote(store.storeId,{latitude:location.latitude,longitude:location.longitude});
    return Response.json({fee:quote.fee,distanceKm:quote.distance_km,distanceKind:quote.distance_kind,currency:'VND'}, {headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const status=(error instanceof AppError)?error.statusCode:(error instanceof LocationError)?error.status:500;
    return Response.json({error:status===500?'Không thể tính phí giao hàng':(error instanceof Error?error.message:'Dữ liệu không hợp lệ')},{status});
  }
}
