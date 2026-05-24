import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { buildRequestUrl } from "@/lib/http/request-origin";

const PUBLIC_PATH_PREFIXES = ["/login", "/signup", "/auth"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let user = null;
  if (supabaseUrl && supabasePublishableKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
        db: {
          schema: "api",
        },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data } = await supabase.auth.getClaims();
      user = data?.claims ?? null;
    } catch (e) {
      console.error("Supabase auth error in proxy middleware:", e);
    }
  }

  const isAuthenticated = !!user;

  const pathname = request.nextUrl.pathname;

  // Route /home only (Answers question 1 of implementation plan)
  // Consolidate /dashboard by redirecting it to /home
  if (pathname.startsWith("/dashboard")) {
    const homeUrl = buildRequestUrl(request, "/home");
    return NextResponse.redirect(homeUrl);
  }

  const isPublicPath = pathname === "/" || PUBLIC_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = buildRequestUrl(request, "/login");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicPath) {
    const homeUrl = buildRequestUrl(request, "/home");
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
