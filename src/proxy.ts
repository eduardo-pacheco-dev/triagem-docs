import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/session-constants"

export function proxy(request: NextRequest) {
  const authed = request.cookies.get(SESSION_COOKIE)?.value === "1"
  if (!authed) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}