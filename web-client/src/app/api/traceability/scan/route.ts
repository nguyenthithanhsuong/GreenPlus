import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { traceabilityFacade } from "../../../../../backend/modules/traceability/facades/traceability.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type ScanBody = {
  qrCode?: string;
};

export async function POST(request: Request) {
  const start = Date.now();
  let qrCode = "";

  try {
    const body = (await request.json()) as ScanBody;
    qrCode = body.qrCode?.trim() ?? "";

    logger.info("Traceability scan attempt", { qrCode });

    if (!qrCode) {
      logger.error("Traceability scan failed - missing qrCode", { qrCode });

      return NextResponse.json({ error: "qrCode is required" }, { status: 400 });
    }

    const result = await traceabilityFacade.scanProductOrigin(qrCode);

    logger.info("Traceability scan success", {
      qrCode,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Traceability scan failed (AppError)", {
        qrCode,
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Traceability scan unexpected error", {
      qrCode,
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}