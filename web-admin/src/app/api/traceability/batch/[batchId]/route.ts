import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { traceabilityFacade } from "../../../../../../backend/modules/traceability/facades/traceability.facade";
import { logger } from "@/lib/logger"; 

type Params = {
  params: Promise<{
    batchId: string;
  }>;
};

export const GET = withSentry(
  async (_: Request, context: Params) => {
    const { batchId } = await context.params;

    const normalizedBatchId = decodeURIComponent(
      batchId ?? "",
    ).trim();

    logger.info("Get batch origin attempt", {
      batchId: normalizedBatchId,
    });

    if (!normalizedBatchId) {
      logger.warn(
        "Get batch origin failed - missing batchId",
      );

      return NextResponse.json(
        { error: "batchId is required" },
        { status: 400 },
      );
    }

    const start = Date.now();

    const result =
      await traceabilityFacade.getBatchOrigin(
        normalizedBatchId,
      );

    logger.info("Get batch origin success", {
      batchId: normalizedBatchId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, {
      status: 200,
    });
  },
);