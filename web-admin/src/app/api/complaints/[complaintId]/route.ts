import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { complaintManagementFacade } from "../../../../../backend/modules/complaints/complaint-management.facade";

export async function PATCH(request: Request, context: { params: Promise<{ complaintId: string }> }) {
  try {
    const params = await context.params;
    const body = (await request.json()) as { status?: "pending" | "resolved" | "rejected"; rejectReason?: string };

    const updated = await complaintManagementFacade.updateStatus(
      params.complaintId,
      body.status ?? "pending",
      body.rejectReason,
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
