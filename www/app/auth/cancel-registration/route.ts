import { NextRequest, NextResponse } from "next/server";

import { hashSignupCancellationToken } from "@/lib/auth/signup-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const redirectUrl = new URL("/auth/cancelled", requestUrl.origin);

  if (!token) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const adminClient = createSupabaseAdminClient();
  const tokenHash = hashSignupCancellationToken(token);

  const { data: row, error } = await adminClient
    .from("signup_cancellation_requests")
    .select("user_id, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .single<{
      user_id: string;
      expires_at: string;
      consumed_at: string | null;
    }>();

  if (error || !row) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  if (row.consumed_at) {
    redirectUrl.searchParams.set("status", "verified");
    return NextResponse.redirect(redirectUrl);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    redirectUrl.searchParams.set("status", "expired");
    return NextResponse.redirect(redirectUrl);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(row.user_id);
  if (deleteError) {
    redirectUrl.searchParams.set("status", "error");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("status", "cancelled");
  return NextResponse.redirect(redirectUrl);
}
