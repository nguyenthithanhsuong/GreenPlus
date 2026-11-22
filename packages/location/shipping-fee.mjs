/** GreenPlus shipping fee: server-authoritative, VND integer, tenant-scoped. */
export const DEFAULT_SHIPPING = Object.freeze({base_fee:15000,per_km:3000,min_fee:15000,free_from:0,max_radius_km:25,distance_factor:1.25});
const keys=Object.keys(DEFAULT_SHIPPING);
const validAmount=(value,max)=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=max;
export function normalizeShippingConfig(input, {strict=false}={}) {
  if(input==null) return {...DEFAULT_SHIPPING};
  if(typeof input!=='object'||Array.isArray(input)) throw new TypeError('Invalid store shipping config');
  if(strict && Object.keys(input).some(k=>!keys.includes(k)))throw new TypeError('Unknown shipping setting');
  const result={...DEFAULT_SHIPPING};
  for(const k of ['base_fee','per_km','min_fee','free_from'])if(input[k]!==undefined){if(!validAmount(input[k],10000000))throw new TypeError(`Invalid shipping ${k}`);result[k]=input[k];}
  for(const k of ['max_radius_km','distance_factor'])if(input[k]!==undefined){if(typeof input[k]!=='number'||!Number.isFinite(input[k])||input[k]<(k==='max_radius_km'?1:1)||input[k]>(k==='max_radius_km'?100:3))throw new TypeError(`Invalid shipping ${k}`);result[k]=input[k];}
  return result;
}
function validCoord(lat,lon){return typeof lat==='number'&&Number.isFinite(lat)&&Math.abs(lat)<=90&&typeof lon==='number'&&Number.isFinite(lon)&&Math.abs(lon)<=180;}
export function distanceKm(origin,destination,factor=1) {
  if(!origin||!destination||!validCoord(origin.latitude,origin.longitude)||!validCoord(destination.latitude,destination.longitude))return null;
  const rad=Math.PI/180;
  const deltaLat=(destination.latitude-origin.latitude)*rad;
  const deltaLon=(destination.longitude-origin.longitude)*rad;
  const a=Math.sin(deltaLat/2)**2+Math.cos(origin.latitude*rad)*Math.cos(destination.latitude*rad)*Math.sin(deltaLon/2)**2;
  return Math.round(6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)))*factor*100)/100;
}
export function quoteShipping(config,store,destination,{cartSubtotal}={}) {
  const feeConfig=normalizeShippingConfig(config);
  const estimatedKm=distanceKm(store,destination,feeConfig.distance_factor);
  if(estimatedKm!==null&&estimatedKm>feeConfig.max_radius_km) {
    const err=new RangeError('Địa chỉ ngoài bán kính giao hàng');err.status=422;throw err;
  }
  const subtotal=Number.isFinite(cartSubtotal)&&cartSubtotal>=0?cartSubtotal:null;
  const free=subtotal!==null&&feeConfig.free_from>0&&subtotal>=feeConfig.free_from;
  const distanceFee=estimatedKm===null?0:Math.ceil(estimatedKm*feeConfig.per_km/1000)*1000;
  const amount=free?0:Math.max(feeConfig.min_fee,feeConfig.base_fee+distanceFee);
  return {fee:amount,distance_km:estimatedKm,distance_kind:estimatedKm===null?'flat_fallback':'straight_line_estimate',currency:'VND',free,config:feeConfig};
}
