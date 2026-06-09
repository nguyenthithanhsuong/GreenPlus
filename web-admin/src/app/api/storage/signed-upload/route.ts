import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";
import { toErrorMessage } from "../../../../../backend/core/errors";

type SignedUploadRequest = {
  bucket?: string;
  path?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignedUploadRequest;
    const bucket = body.bucket?.trim() ?? "";
    const path = body.path?.trim() ?? "";

    logger.info("Create signed upload URL attempt", { bucket, path });

    if (!bucket || !path) {
      logger.error("Create signed upload URL failed - missing bucket or path");
      return NextResponse.json({ error: "bucket and path are required" }, { status: 400 });
    }

    const start = Date.now();
    const serviceClient = createServiceRoleSupabaseClient();
    const { data, error } = await serviceClient.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      logger.error("Create signed upload URL failed - storage error", { error: error?.message });
      return NextResponse.json({ error: error?.message ?? "Failed to create signed upload URL" }, { status: 400 });
    }

    logger.info("Create signed upload URL success", {
      bucket,
      path,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      {
        bucket,
        path,
        token: data.token,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Create signed upload URL unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
