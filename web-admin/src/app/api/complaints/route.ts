import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { complaintManagementFacade } from "../../../../backend/modules/complaints/complaint-management.facade";

export async function GET() {
  try {
    const items = await complaintManagementFacade.listComplaints();

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
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

