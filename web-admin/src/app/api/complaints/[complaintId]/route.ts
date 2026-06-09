import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { complaintManagementFacade } from "../../../../../backend/modules/complaints/complaint-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function PATCH(request: Request, context: { params: Promise<{ complaintId: string }> }) {
  const { complaintId } = await context.params;

  logger.info("Update complaint status attempt", { complaintId });

  try {
    const body = (await request.json()) as { status?: "pending" | "resolved" | "rejected"; rejectReason?: string };

    const start = Date.now();
    const updated = await complaintManagementFacade.updateStatus(
      complaintId,
      body.status ?? "pending",
      body.rejectReason,
    );

    logger.info("Update complaint status success", {
      complaintId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update complaint status failed", {
        complaintId,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update complaint status unexpected error", {
      complaintId,
      error: toErrorMessage(error),
    });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}