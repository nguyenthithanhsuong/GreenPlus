import {NextResponse} from 'next/server';
import {requireShipper,shipperApiError} from '../../../../../../server/shipper-auth';
import {getShipperMapDetails} from '../../../../../../server/shipper-deliveries';
export const runtime = 'nodejs';
export async function GET(_request: Request, ctx: {params: Promise<{orderId:string}>}) {
  try {
    const user = await requireShipper();
    const {orderId} = await ctx.params;
    const result = await getShipperMapDetails(user, orderId);
    return NextResponse.json(result, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({error:result.message,code:result.code}, {status:result.status,headers:{'Cache-Control':'no-store'}});
  }
}
