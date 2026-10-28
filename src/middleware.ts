import { NextResponse, type NextRequest } from "next/server";

/**
 * "/" has no language, so it is a redirect, not a page. It used to be a root
 * page, which forced a root layout above [lang] and made <html lang> impossible.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const lang = request.cookies.get("nightcap-lang")?.value;
    return NextResponse.redirect(new URL(lang === "zh-CN" ? "/zh-CN" : "/en", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
