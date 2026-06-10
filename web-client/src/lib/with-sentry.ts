import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../backend/core/errors";

type Handler<TRequest extends Request, TContext> = (
  request: TRequest,
  context: TContext,
) => Promise<Response>;

export function withSentry<TRequest extends Request, TContext = { params: Promise<Record<string, string>> }>(handler: Handler<TRequest, TContext>): Handler<TRequest, TContext> {
  return async (request: TRequest, context: TContext): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      Sentry.captureException(error);
      await Sentry.flush(2000);

      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }

      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 },
      );
    }
  };
}