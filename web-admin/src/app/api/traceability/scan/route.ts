import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { traceabilityFacade } from "../../../../../backend/modules/traceability/facades/traceability.facade";
import { logger } from "@/lib/logger"; 

type ScanBody = {
  qrCode?: string;
};

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as ScanBody;

  const qrCode = body.qrCode?.trim() ?? "";

  logger.info("Scan product origin attempt", {
    qrCode,
  });

  if (!qrCode) {
    logger.warn(
      "Scan product origin failed - missing qrCode",
    );

    return NextResponse.json(
      { error: "qrCode is required" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const result =
    await traceabilityFacade.scanProductOrigin(
      qrCode,
    );

  logger.info("Scan product origin success", {
    qrCode,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(result, {
    status: 200,
  });
});