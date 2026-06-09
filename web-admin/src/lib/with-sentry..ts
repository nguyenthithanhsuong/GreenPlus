import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../backend/core/errors";

export function withSentry(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      Sentry.captureException(error);
      await Sentry.flush(2000);

      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }
  };
}