import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("consent") === "1") {
    const res = NextResponse.next();
    res.cookies.set("cp_consent", "1", { path: "/", maxAge: 60*60*24*365 });
    return res;
  }
  return NextResponse.next();
}
