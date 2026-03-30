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

function readAccessToken(request: Request, fallbackToken?: string | null): string {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  return (fallbackToken ?? bearerToken).trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = readAccessToken(request, searchParams.get("accessToken"));

    if (!accessToken) {
      return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
    }

    const supabase = createSupabaseAnonClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createSupabaseServiceClient();
    if (serviceClient) {
      const { data: profileData } = await serviceClient
        .from("users")
        .select("user_id,name,email,phone,address,status")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileData) {
        return NextResponse.json(profileData, { status: 200 });
      }
    }

    return NextResponse.json(
      {
        user_id: authData.user.id,
        name: authData.user.user_metadata?.full_name ?? null,
        email: authData.user.email ?? null,
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

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      name?: string;
      phone?: string;
      address?: string;
    };

    const accessToken = readAccessToken(request, body.accessToken);
    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const address = body.address?.trim() ?? "";

    if (!accessToken || !name || !phone) {
      return NextResponse.json({ error: "accessToken, name and phone are required" }, { status: 400 });
    }

    const supabase = createSupabaseAnonClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createSupabaseServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required" }, { status: 500 });
    }

    const { data, error } = await serviceClient
      .from("users")
      .update({
        name,
        phone,
        address,
      })
      .eq("user_id", authData.user.id)
      .select("user_id,name,email,phone,address,status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
