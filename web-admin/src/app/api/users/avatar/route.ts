import { withSentry } from "@/lib/with-sentry";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";
import { toErrorMessage } from "../../../../../backend/core/errors";

const BUCKET = "User_Images";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    logger.info("User image upload attempt", { 
      hasFile: file instanceof File,
      mimeType: file instanceof File ? file.type : "none" 
    });

    if (!(file instanceof File)) {
      logger.error("User image upload failed - missing file");
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      logger.error("User image upload failed - invalid mime type", { mimeType: file.type });
      return NextResponse.json({ error: "Only jpeg/png/webp/gif are allowed" }, { status: 400 });
    }

    const start = Date.now();
    const ext = extensionFromMime(file.type);
    const objectPath = `users/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

    const client = createServiceRoleSupabaseClient();
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      logger.error("User image upload failed - storage error", { error: uploadError.message });
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(objectPath);

    logger.info("User image upload success", { 
      path: objectPath, 
      duration_ms: Date.now() - start 
    });

    return NextResponse.json(
      {
        bucket: BUCKET,
        path: objectPath,
        publicUrl: publicUrlData.publicUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("User image upload unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
