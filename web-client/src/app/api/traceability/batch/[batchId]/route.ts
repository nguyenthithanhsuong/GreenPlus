import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { traceabilityFacade } from "../../../../../../backend/modules/traceability/facades/traceability.facade";

type Params = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const { batchId } = await context.params;
    const normalizedBatchId = decodeURIComponent(batchId ?? "").trim();

    if (!normalizedBatchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const result = await traceabilityFacade.getBatchOrigin(normalizedBatchId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
