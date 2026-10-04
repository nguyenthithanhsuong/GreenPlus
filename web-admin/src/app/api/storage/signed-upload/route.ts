import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { logger } from "@/lib/logger";

const ALLOWED_BUCKETS = new Set([
  "Product-Image",
  "Category-Image",
  "User_Images",
  "Post-Attachment",
  "product-images",
]);

type SignedUploadRequest = {
  bucket?: string;
  path?: string;
};

function readAccessToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)gp_admin_auth=([^;]+)/);
  return match ? decodeURIComponent(match[1]).trim() : "";
}

export const POST = withSentry(async (request: Request) => {
  const accessToken = readAccessToken(request);
  const verifiedUser = accessToken
    ? await new AuthService().verifySession(accessToken)
    : null;

  if (
    !verifiedUser ||
    !["admin", "manager", "employee"].includes(verifiedUser.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SignedUploadRequest;

  const bucket = body.bucket?.trim() ?? "";
  const path = body.path?.trim() ?? "";

  logger.info("Create signed upload URL attempt", {
    bucket,
    path,
  });

  if (!bucket || !path) {
    logger.error("Create signed upload URL failed - missing bucket or path");

    return NextResponse.json(
      { error: "bucket and path are required" },
      { status: 400 },
    );
  }

  if (
    !ALLOWED_BUCKETS.has(bucket) ||
    path.includes("..") ||
    path.startsWith("/")
  ) {
    return NextResponse.json(
      { error: "Invalid upload destination" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const serviceClient = createServiceRoleSupabaseClient();

  const { data, error } = await serviceClient.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    logger.error("Create signed upload URL failed - storage error", {
      error: error?.message,
    });

    return NextResponse.json(
      {
        error: error?.message ?? "Failed to create signed upload URL",
      },
      { status: 400 },
    );
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
    { status: 200 },
  );
});
