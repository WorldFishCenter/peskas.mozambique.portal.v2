import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";

import type { MiddlewareFactory } from "./types"
import { JWT_COOKIE_NAME } from "./const"

const withJwt: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    const res = await next(request, _next)
    
    // TEMPORARILY DISABLED FOR MOZAMBIQUE OPEN ACCESS
    // Uncomment the code below to re-enable authentication
    
    /*
    const [cookieToken] = request.cookies
      .getAll()
      .filter((o) => o.name.indexOf(JWT_COOKIE_NAME) > -1)

    const pageMatches = /.*\/(?<page>(sign-in|forgot-password|reset-password))/gim.exec(
      request.nextUrl.pathname,
    )
    if (pageMatches?.groups?.page &&
      !cookieToken
    ) {
      return res
    }

    if (pageMatches?.groups?.page &&
      cookieToken
    ) {
      return NextResponse.redirect(
        new URL(`/`, request.url),
      )
    }

    if (!cookieToken) {
      return NextResponse.redirect(
        new URL(`/sign-in`, request.url),
      )
    } 
    */

    // For now, always allow access
    return res
  }
}

export default withJwt
