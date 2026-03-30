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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "name, email, password, and confirmPassword are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "password and confirmPassword do not match" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let profileSynced = false;
    const serviceClient = createSupabaseServiceClient();
    if (serviceClient && data.user?.id) {
      const { data: roleData } = await serviceClient
        .from("roles")
        .select("role_id")
        .eq("role_name", "customer")
        .maybeSingle();

      const customerRoleId = roleData?.role_id ?? null;
      const { error: upsertError } = await serviceClient.from("users").upsert(
        {
          user_id: data.user.id,
          role_id: customerRoleId,
          name,
          email,
          status: "active",
        },
        {
          onConflict: "user_id",
        }
      );

      profileSynced = !upsertError;
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        profileSynced,
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
