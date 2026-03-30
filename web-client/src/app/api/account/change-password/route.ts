import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function readAccessToken(request: Request, fallbackToken?: string): string {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  return (fallbackToken ?? bearerToken).trim();
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const accessToken = readAccessToken(request, body.accessToken);
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!accessToken) {
      return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "newPassword and confirmPassword are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "newPassword and confirmPassword do not match" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "newPassword must be at least 6 characters" }, { status: 400 });
    }

    const anonClient = createSupabaseAnonClient();
    const { data: authData, error: authError } = await anonClient.auth.getUser(accessToken);

    if (authError || !authData.user || !authData.user.email) {
      return NextResponse.json({ error: authError?.message ?? "Unauthorized" }, { status: 401 });
    }

    if (!currentPassword) {
      return NextResponse.json({ error: "currentPassword is required" }, { status: 400 });
    }

    const { error: verifyError } = await anonClient.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "currentPassword is incorrect" }, { status: 400 });
    }

    const serviceClient = createSupabaseServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required" }, { status: 500 });
    }

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(authData.user.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ updated: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
