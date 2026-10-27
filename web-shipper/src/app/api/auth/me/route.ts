import { NextResponse } from 'next/server';
import { requireShipper, shipperApiError } from '../../../../server/shipper-auth';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const user = await requireShipper();
    return NextResponse.json({ user }, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({error:result.message,code:result.code}, {status:result.status,headers:{'Cache-Control':'no-store'}});
  }
}
