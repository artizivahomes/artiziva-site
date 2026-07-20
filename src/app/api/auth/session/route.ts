import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const userData = JSON.parse(sessionCookie.value);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ user: null });
  }
}
