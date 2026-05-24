import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { readFileSync } from "node:fs";

import { buildRequestUrl } from "@/lib/http/request-origin";
import {
  buildSignupSecurityEmailHtml,
  buildSignupCancellationExpiryIso,
  createSignupCancellationToken,
  deriveDisplayNameFromEmail,
  hashSignupCancellationToken,
} from "@/lib/auth/signup-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServerSecret } from "@/lib/server/env";

type SignupPayload = {
  email?: string;
  password?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
      },
    },
    { status },
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let payload: SignupPayload;
  try {
    payload = (await request.json()) as SignupPayload;
  } catch {
    return jsonError("Invalid signup payload.", 400);
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";

  if (!email || !password) {
    return jsonError("Email and password are required.", 400);
  }

  if (!isValidEmail(email)) {
    return jsonError("Enter a valid email address.", 400);
  }

  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters long.", 400);
  }

  const resendApiKey = getServerSecret("RESEND_API_KEY");
  const resendFromEmail = getServerSecret("RESEND_FROM_EMAIL");
  if (!resendApiKey || !resendFromEmail) {
    return jsonError("Email signup security is not configured on this server.", 503);
  }

  const verificationUrl = buildRequestUrl(request, "/auth/callback");
  verificationUrl.searchParams.set("next", "/home");
  const derivedDisplayName = deriveDisplayNameFromEmail(email);

  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: {
        display_name: derivedDisplayName,
        full_name: derivedDisplayName,
        name: derivedDisplayName,
      },
      redirectTo: verificationUrl.toString(),
    },
  });

  if (error) {
    return jsonError(error.message, 400);
  }

  if (!data.user?.id) {
    return jsonError("Account registration did not return a pending user.", 502);
  }

  const verificationActionUrl = data.properties?.action_link?.trim();
  if (!verificationActionUrl) {
    await adminClient.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    return jsonError("Unable to generate the verification link for this signup.", 502);
  }

  const rawToken = createSignupCancellationToken();
  const tokenHash = hashSignupCancellationToken(rawToken);
  const cancelUrl = buildRequestUrl(request, "/auth/cancel-registration");
  cancelUrl.searchParams.set("token", rawToken);

  const { error: upsertError } = await adminClient.from("signup_cancellation_requests").upsert(
    {
      user_id: data.user.id,
      email,
      token_hash: tokenHash,
      expires_at: buildSignupCancellationExpiryIso(),
      consumed_at: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error("Failed to persist signup cancellation request", {
      message: upsertError.message,
      code: upsertError.code,
      details: upsertError.details,
      hint: upsertError.hint,
    });
    await adminClient.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    return jsonError("Unable to secure this signup request. Please try again.", 500);
  }

  const logoPath = join(process.cwd(), "public/logo.png");
  let logoBase64: string | null = null;
  try {
    logoBase64 = readFileSync(logoPath).toString("base64");
  } catch (err) {
    console.error("Failed to read logo.png for email attachment:", err);
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject: "Verify your LoopHarvest account",
      html: buildSignupSecurityEmailHtml({
        cancelUrl: cancelUrl.toString(),
        verificationActionUrl,
        logoUrl: logoBase64 ? "cid:logo-image" : undefined,
      }),
      attachments: logoBase64
        ? [
            {
              content: logoBase64,
              filename: "logo.png",
              contentId: "logo-image",
              contentType: "image/png",
            },
          ]
        : [],
    }),
  }).catch(() => null);

  if (!emailResponse?.ok) {
    await adminClient.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    return jsonError("Unable to deliver the signup security email. Please try again.", 502);
  }

  return NextResponse.json({
    success: true,
    data: {
      email,
    },
    message: "Verification email sent.",
  });
}
