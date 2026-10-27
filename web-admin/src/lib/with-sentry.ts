import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { resolveTenantScope } from "../../backend/core/tenant-request";
import { runTenantScope } from "../../backend/core/tenant-store";
import { AppError } from "../../backend/core/errors";

type Handler<TRequest extends Request, TContext> = (
  request: TRequest,
  context: TContext,
) => Promise<Response>;

export function withSentry<
  TRequest extends Request,
  TContext = { params: Promise<Record<string, string>> },
>(
  handler: Handler<TRequest, TContext>,
  options: { publicRoute?: boolean } = {},
): Handler<TRequest, TContext> {
  return async (request: TRequest, context: TContext): Promise<Response> => {
    try {
      // This wraps all legacy service-role repository calls in an authenticated,
      // request-local tenant boundary. The DB receives store_id filters.
      if (options.publicRoute) return await handler(request, context);
      const scope = await resolveTenantScope(request);
      return await runTenantScope(scope, () => handler(request, context));
    } catch (error) {
      console.error(
        "[Unhandled API error]:",
        error instanceof Error ? error.message : "Unknown error",
      );

      Sentry.captureException(error);

      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }

      return NextResponse.json(
        { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
        { status: 500 },
      );
    }
  };
}
