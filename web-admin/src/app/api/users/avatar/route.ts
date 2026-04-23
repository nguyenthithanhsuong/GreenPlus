import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";

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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Only jpeg/png/webp/gif are allowed" }, { status: 400 });
    }

    const ext = extensionFromMime(file.type);
    const objectPath = `users/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

    const client = createServiceRoleSupabaseClient();
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(objectPath);

    return NextResponse.json(
      {
        bucket: BUCKET,
        path: objectPath,
        publicUrl: publicUrlData.publicUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}