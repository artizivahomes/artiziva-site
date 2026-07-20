import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    // Verify password hash (SHA-256)
    const inputHash = crypto.createHash("sha256").update(password).digest("hex");
    if (inputHash !== user.password_hash) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    // Set session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    
    // Cookie expires in 7 days
    response.cookies.set("admin_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
