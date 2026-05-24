import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildRequestUrl } from "@/lib/http/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/home";

  // Check if provider returned error query parameters
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");

  if (oauthError || oauthErrorDescription) {
    const errorRedirectUrl = buildRequestUrl(request, "/auth/error");
    errorRedirectUrl.searchParams.set("error", oauthError || "callback_error");
    errorRedirectUrl.searchParams.set("message", oauthErrorDescription || "Authentication provider reported an error.");
    return NextResponse.redirect(errorRedirectUrl);
  }

  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const errorRedirectUrl = buildRequestUrl(request, "/auth/error");
        errorRedirectUrl.searchParams.set("error", "token_exchange_failed");
        errorRedirectUrl.searchParams.set("message", error.message);
        return NextResponse.redirect(errorRedirectUrl);
      }
    } catch (err) {
      const errorRedirectUrl = buildRequestUrl(request, "/auth/error");
      errorRedirectUrl.searchParams.set("error", "internal_callback_error");
      errorRedirectUrl.searchParams.set("message", err instanceof Error ? err.message : "Failed to establish secure session.");
      return NextResponse.redirect(errorRedirectUrl);
    }
  }

  const redirectUrl = buildRequestUrl(
    request,
    next.startsWith("/") ? next : "/home",
  );

  return NextResponse.redirect(redirectUrl);
}
