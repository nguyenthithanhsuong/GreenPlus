import {NextResponse} from 'next/server';
import {requireShipper,shipperApiError} from '../../../../../../server/shipper-auth';
import {getShipperMapDetails} from '../../../../../../server/shipper-deliveries';
import {validPoint,convertOsrmResponse} from '../../../../../../lib/map-helpers.mjs';
export const runtime = 'nodejs';

// Development-only best-effort throttle, in-process only. Never use public demo routing for production.
const requestTimes = new Map<string,number[]>();
export async function POST(request: Request, ctx: {params: Promise<{orderId:string}>}) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json(
    {error:'Định tuyến OSRM demo chỉ dùng khi phát triển local'}, {status:403});
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json(
    {error:'Nguồn yêu cầu không hợp lệ'}, {status:403});
  try {
    const user = await requireShipper();
    const {orderId} = await ctx.params;
    await getShipperMapDetails(user, orderId); // verify ownership and store each request
    const payload = await request.json().catch(() => null);
    const start = payload?.start, end = payload?.end;
    if (!validPoint(start) || !validPoint(end))
      return NextResponse.json({error:'Tọa độ không hợp lệ'}, {status:400});
    const now=Date.now();
    // Limited to 4 requests/min/user in this server process; not distributed.
    const recent = (requestTimes.get(user.user_id) ?? []).filter(t=>now-t<60_000);
    if (recent.length>=4) return NextResponse.json({error:'Đã đạt giới hạn thử nghiệm, vui lòng đợi 1 phút'}, {status:429});
    recent.push(now);requestTimes.set(user.user_id,recent);
    if (requestTimes.size>1000) for (const [key,times] of requestTimes) {
      if (!times.some(t=>now-t<60_000)) requestTimes.delete(key);
    }
    const url=new URL(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`);
    url.searchParams.set('overview','full');url.searchParams.set('geometries','geojson');
    url.searchParams.set('steps','false');
    const upstream=await fetch(url,{signal:AbortSignal.timeout(9000),headers:{Accept:'application/json'},cache:'no-store'});
    if (!upstream.ok) throw new Error('Routing demo unavailable');
    const result=convertOsrmResponse(await upstream.json());
    if (!result) throw new Error('No valid route');
    return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    // Third-party network errors should not leak endpoints or user details.
    if (error instanceof Error && (/unavailable|valid route/i).test(error.message))
      return NextResponse.json({error:'Dịch vụ tuyến đường demo không khả dụng. Có thể dùng đường nối minh họa.'},{status:503});
    if (error instanceof Error && (error.name==='TimeoutError'||error.name==='AbortError'))
      return NextResponse.json({error:'Dịch vụ demo phản hồi quá lâu, dùng đường nối minh họa.'},{status:503});
    const result=shipperApiError(error);
    return NextResponse.json({error:result.message,code:result.code},{status:result.status,headers:{'Cache-Control':'no-store'}});
  }
}
