import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { traceabilityFacade } from "../../../../../backend/modules/traceability/facades/traceability.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type ScanBody = {
  qrCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanBody;
    const qrCode = body.qrCode?.trim() ?? "";

    logger.info("Scan product origin attempt", { qrCode });

    if (!qrCode) {
      logger.warn("Scan product origin failed - missing qrCode");
      return NextResponse.json({ error: "qrCode is required" }, { status: 400 });
    }

    const start = Date.now();
    const result = await traceabilityFacade.scanProductOrigin(qrCode);

    logger.info("Scan product origin success", {
      qrCode,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Scan product origin failed", { 
        message: error.message 
      });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Scan product origin unexpected error", { 
      error: toErrorMessage(error) 
    });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}