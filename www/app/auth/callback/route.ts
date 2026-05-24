import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deriveDisplayNameFromEmail } from "@/lib/auth/signup-security";
import { buildRequestUrl } from "@/lib/http/request-origin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isGeneratedAvatarUrl } from "@/lib/users/avatar";

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

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const adminClient = createSupabaseAdminClient();
          const { data: existingUserRow } = await adminClient
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          const persistedDisplayName =
            typeof existingUserRow?.display_name === "string" && existingUserRow.display_name.trim()
              ? existingUserRow.display_name
              : null;
          const persistedAvatarUrl =
            typeof existingUserRow?.avatar_url === "string" &&
            existingUserRow.avatar_url.trim() &&
            !isGeneratedAvatarUrl(existingUserRow.avatar_url)
              ? existingUserRow.avatar_url
              : null;

          const derivedDisplayName =
            persistedDisplayName ||
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? deriveDisplayNameFromEmail(user.email) : null);
          const metadataAvatarUrl =
            typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
              ? user.user_metadata.avatar_url
              : null;
          const providerPictureUrl =
            typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
              ? user.user_metadata.picture
              : null;
          const derivedAvatarUrl =
            persistedAvatarUrl ||
            (!isGeneratedAvatarUrl(metadataAvatarUrl)
              ? metadataAvatarUrl
              : providerPictureUrl);

          await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              ...(derivedDisplayName
                ? {
                    display_name: derivedDisplayName,
                    full_name: derivedDisplayName,
                    name: derivedDisplayName,
                  }
                : {}),
              avatar_url: derivedAvatarUrl,
            },
          });

          await adminClient.from("users").upsert(
            {
              id: user.id,
              email: user.email,
              display_name: derivedDisplayName,
              avatar_url: derivedAvatarUrl,
            },
            { onConflict: "id" },
          );

          await adminClient
            .from("signup_cancellation_requests")
            .update({ consumed_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .is("consumed_at", null);
        }
      } catch (cleanupError) {
        console.error("Unable to consume signup cancellation request:", cleanupError);
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
