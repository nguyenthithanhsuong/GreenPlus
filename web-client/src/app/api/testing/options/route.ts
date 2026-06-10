import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { testingOptionsFacade } from "../../../../../backend/modules/testing/facades/testing-options.facade";

export const GET = withSentry(async () => {
  try {
    const options = await testingOptionsFacade.getAllOptions();
    return NextResponse.json(options, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
});