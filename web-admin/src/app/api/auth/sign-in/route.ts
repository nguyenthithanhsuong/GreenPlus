import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { createAnonSupabaseClient } from "../../../../../backend/core/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const supabase = createAnonSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.session || !data.user) {
      throw new AppError("Invalid credentials", 401);
    }

    // get role from DB
    const { data: profile } = await supabase
      .from("users")
      .select("role_name, user_id, name, email, phone, address, image_url, status")
      .eq("user_id", data.user.id)
      .single();

    return NextResponse.json({
      session: data.session,
      user: profile,
      role_name: profile?.role_name ?? null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}