import { NextResponse } from 'next/server';
import { requireShipper, shipperApiError } from '../../../../server/shipper-auth';
import { listShipperDeliveries } from '../../../../server/shipper-deliveries';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const user = await requireShipper();
    const items = await listShipperDeliveries(user);
    return NextResponse.json({items, total:items.length}, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({error:result.message,code:result.code}, {status:result.status,headers:{'Cache-Control':'no-store'}});
  }
}
