import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { complaintManagementFacade } from "../../../../backend/modules/complaints/complaint-management.facade";

const getHandler = async () => {
  const items = await complaintManagementFacade.listComplaints();

  return NextResponse.json(
    {
      items,
      total: items.length,
    },
    { status: 200 }
  );
};

export const GET = withSentry(getHandler as Parameters<typeof withSentry>[0]);