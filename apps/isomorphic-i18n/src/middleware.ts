import { NextResponse } from "next/server"

import withJwt from "@/middleware/withJwt"
import withLang from "@/middleware/withLang"
import withPermission from "@/middleware/withPermission"

export function defaultMiddleware() {
  return NextResponse.next();
}

export default withPermission(withJwt(withLang(defaultMiddleware)))

export const config = {
  matcher: [
    '/',
    '/sign-in',
    '/(en|de|es|ar|he|zh)/:path*',
  ],
};