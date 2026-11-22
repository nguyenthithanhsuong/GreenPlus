import { supabaseServer } from '../../core/supabase';
import { AppError } from '../../core/errors';
import { quoteShipping } from '../../../../packages/location/shipping-fee.mjs';

/** Server-authoritative fee. Never accept price/distance/subtotal from a browser. */
export async function shippingQuote(storeId:string, destination:{latitude:number;longitude:number}) {
  const [storeResult, configResult] = await Promise.all([
    supabaseServer.from('stores').select('store_id,latitude,longitude,status').eq('store_id',storeId).eq('status','active').maybeSingle(),
    supabaseServer.from('store_settings').select('shipping_config').eq('store_id',storeId).maybeSingle(),
  ]);
  if(storeResult.error||configResult.error)throw new AppError('Không lấy được cấu hình phí giao hàng',503);
  if(!storeResult.data)throw new AppError('Cửa hàng không hoạt động',404);
  const store=storeResult.data;
  try{
    return quoteShipping(configResult.data?.shipping_config as Record<string,number>|null,
      (store.latitude==null||store.longitude==null)?null:{latitude:Number(store.latitude),longitude:Number(store.longitude)},destination);
  } catch(err) {
    if(err instanceof RangeError)throw new AppError(err.message,422);
    throw new AppError('Cấu hình phí giao hàng không hợp lệ, liên hệ cửa hàng',503);
  }
}
