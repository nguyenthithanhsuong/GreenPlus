import { withSentry } from "@/lib/with-sentry";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { logger } from "@/lib/logger"; 

const BUCKET = "Product-Image";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";

  return "bin";
}

export const POST = withSentry(async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  logger.info("Product image upload attempt", {
    hasFile: file instanceof File,
    mimeType: file instanceof File ? file.type : "none",
  });

  if (!(file instanceof File)) {
    logger.error("Product image upload failed - missing file");

    return NextResponse.json(
      { error: "file is required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    logger.error(
      "Product image upload failed - invalid mime type",
      { mimeType: file.type },
    );

    return NextResponse.json(
      { error: "Only jpeg/png/webp/gif are allowed" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const ext = extensionFromMime(file.type);
  const objectPath = `products/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

  const client = createServiceRoleSupabaseClient();

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error(
      "Product image upload failed - storage error",
      { error: uploadError.message },
    );

    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 },
    );
  }

  const { data: publicUrlData } = client.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);

  logger.info("Product image upload success", {
    path: objectPath,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    {
      bucket: BUCKET,
      path: objectPath,
      publicUrl: publicUrlData.publicUrl,
    },
    { status: 200 },
  );
});