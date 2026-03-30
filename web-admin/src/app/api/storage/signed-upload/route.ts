import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";

type SignedUploadRequest = {
  bucket?: string;
  path?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignedUploadRequest;
    const bucket = body.bucket?.trim() ?? "";
    const path = body.path?.trim() ?? "";

    if (!bucket || !path) {
      return NextResponse.json({ error: "bucket and path are required" }, { status: 400 });
    }

    const serviceClient = createServiceRoleSupabaseClient();
    const { data, error } = await serviceClient.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create signed upload URL" }, { status: 400 });
    }

    return NextResponse.json(
      {
        bucket,
        path,
        token: data.token,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
