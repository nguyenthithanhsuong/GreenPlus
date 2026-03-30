import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { traceabilityFacade } from "../../../../../backend/modules/traceability/facades/traceability.facade";

type ScanBody = {
  qrCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanBody;
    const qrCode = body.qrCode?.trim() ?? "";

    if (!qrCode) {
      return NextResponse.json({ error: "qrCode is required" }, { status: 400 });
    }

    const result = await traceabilityFacade.scanProductOrigin(qrCode);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
