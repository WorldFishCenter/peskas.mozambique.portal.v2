import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server"
import { getToken } from 'next-auth/jwt'

import { TPermission } from "@repo/nosql/schema/auth"
import type { MiddlewareFactory } from "./types"
import { JWT_COOKIE_NAME } from "./const"

const withPermission: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    const res = await next(request, _next)
    const groupPageMatches = /.*\/groups\/(?<group>[^/]+)/gim.exec(
      request.nextUrl.pathname,
    )

    if (!groupPageMatches?.groups?.group) {
      return res
    }        

    const [cookieToken] = request.cookies
      .getAll()
      .filter((o) => o.name.indexOf(JWT_COOKIE_NAME) > -1)
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('Secret is not set.')
    }
    
    if (!cookieToken) {
      return NextResponse.redirect(
        new URL(`/?error=10001`, request.url),
      )
    }
    const payload = await getToken({
      req: request,
      secret,
      cookieName: cookieToken.name,
    })

    const groups: TPermission[] = payload?.groups as TPermission[]
    if (groups.length === 0) {
      return NextResponse.redirect(
        new URL(`/?error=10002`, request.url),
      )
    }

    const hasGroup = groups
      .filter(item => (item.name).toLowerCase() === (groupPageMatches?.groups?.group ?? '').toLowerCase())

    if (hasGroup.length === 0) {
      return NextResponse.redirect(
        new URL(`/?error=10003`, request.url),
      )
    }

    return res;
  };
};

export default withPermission;
