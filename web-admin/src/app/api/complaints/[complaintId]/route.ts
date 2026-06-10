import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { complaintManagementFacade } from "../../../../../backend/modules/complaints/complaint-management.facade";
import { logger } from "@/lib/logger"; 

const handler = async (request: Request, context: { params: Promise<{ complaintId: string }> }) => {
  const { complaintId } = await context.params;

  logger.info("Update complaint status attempt", { complaintId });

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
};

export const PATCH = withSentry(handler as Parameters<typeof withSentry>[0]);