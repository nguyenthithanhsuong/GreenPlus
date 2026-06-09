import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { traceabilityFacade } from "../../../../../../backend/modules/traceability/facades/traceability.facade";
import { logger } from "../../../../../../../packages/supabase-shared/src/logger";

type Params = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function GET(_: Request, context: Params) {
  const { batchId } = await context.params;
  const normalizedBatchId = decodeURIComponent(batchId ?? "").trim();

  logger.info("Get batch origin attempt", { batchId: normalizedBatchId });

  if (!normalizedBatchId) {
    logger.error("Get batch origin failed - missing batchId");
    return NextResponse.json({ error: "batchId is required" }, { status: 400 });
  }

  try {
    const start = Date.now();
    const result = await traceabilityFacade.getBatchOrigin(normalizedBatchId);

    logger.info("Get batch origin success", {
      batchId: normalizedBatchId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get batch origin failed", {
        batchId: normalizedBatchId,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Get batch origin unexpected error", {
      batchId: normalizedBatchId,
      error: toErrorMessage(error),
    });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
