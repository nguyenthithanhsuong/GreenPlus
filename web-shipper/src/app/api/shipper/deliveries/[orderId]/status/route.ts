import { NextResponse } from 'next/server';
import { requireShipper, shipperApiError } from '../../../../../../server/shipper-auth';
import { updateShipperDelivery } from '../../../../../../server/shipper-deliveries';
export const runtime = 'nodejs';
export async function PATCH(request:Request, context:{params:Promise<{orderId:string}>}) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({error:'Nguồn yêu cầu không hợp lệ'}, {status:403});
  }
  const {orderId} = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.currentStatus !== 'string' || typeof body.status !== 'string') {
    return NextResponse.json({error:'Dữ liệu yêu cầu không hợp lệ'}, {status:400});
  }
  try {
    const user = await requireShipper();
    const item = await updateShipperDelivery(user, orderId, body.currentStatus, body.status);
    return NextResponse.json(item, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({error:result.message,code:result.code}, {status:result.status,headers:{'Cache-Control':'no-store'}});
  }
}
