import "server-only";

import { createHash, randomBytes } from "node:crypto";

const SIGNUP_CANCELLATION_TTL_HOURS = 24;

export function createSignupCancellationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSignupCancellationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildSignupCancellationExpiryIso() {
  return new Date(Date.now() + SIGNUP_CANCELLATION_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

export function deriveDisplayNameFromEmail(email: string) {
  const localPart = email.trim().toLowerCase().split("@")[0] ?? "";
  const normalized = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "LoopHarvest User";
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildSignupSecurityEmailHtml(params: {
  cancelUrl: string;
  verificationActionUrl: string;
  logoUrl?: string;
}) {
  const { cancelUrl, verificationActionUrl, logoUrl } = params;
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify your LoopHarvest account</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #FFFFFF;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0A0A; min-width: 100%; table-layout: fixed;">
        <tr>
          <td align="center" valign="top" style="padding: 40px 16px;">
            <!-- Container Card -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #141414; border: 1px solid rgba(255, 255, 255, 0.08); border-top: 4px solid #A8D97F; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.5);">
              
              <!-- Header Branding -->
              <tr>
                <td align="center" style="padding: 36px 32px 24px; background-color: #161616; border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 12px;">
                        <img src="${logoUrl || "https://cdn.jsdelivr.net/gh/Aytsuu/LoopHarvest@v1/development/www/public/logo.png"}" alt="LoopHarvest Logo" width="48" height="48" style="display: block; width: 48px; height: 48px; object-fit: contain; border: none; outline: none;" />
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <span style="font-family: 'Syne', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #A8D97F; letter-spacing: -0.5px; text-transform: uppercase;">LoopHarvest</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 36px 32px 24px;">
                  <h1 style="margin: 0 0 16px; font-family: 'Syne', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; text-align: center;">Account Verification Required</h1>
                  
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #E5E5E5;">
                    A LoopHarvest account signup was started with this email address. To activate your account and join our hyperlocal circular network, please verify this email address.
                  </p>

                  <!-- Verification Call to Action -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <a href="${verificationActionUrl}" target="_blank" style="display: inline-block; font-family: 'Syne', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #A8D97F; color: #1A3A05; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 999px; box-shadow: 0 4px 12px rgba(168, 217, 127, 0.2); transition: all 0.2s ease;">
                          Verify My Account
                        </a>
                      </td>
                    </tr>
                  </table>

                  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 0 0 24px;" />

                  <!-- Security Fallback Section -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 16px; background-color: rgba(224, 86, 86, 0.04); border: 1px solid rgba(224, 86, 86, 0.15); border-radius: 16px;">
                        <p style="margin: 0 0 6px; font-family: 'Syne', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #F87171;">Did not request this?</p>
                        <p style="margin: 0 0 14px; font-size: 12px; line-height: 1.5; color: #A3A3A3;">
                          If you did not authorize this signup, cancel the pending registration immediately to delete the unverified account request.
                        </p>
                        <a href="${cancelUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 700; color: #F87171; text-decoration: underline;">
                          Cancel Pending Registration
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer/Fineprint -->
              <tr>
                <td align="center" style="padding: 0 32px 32px; background-color: #141414;">
                  <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #737373; text-align: center; max-width: 360px;">
                    For security, the cancellation link expires in 24 hours and is disabled automatically once the account is verified.
                  </p>
                </td>
              </tr>

            </table>

            <!-- Outer Footer -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;">
              <tr>
                <td height="24" style="font-size: 0; line-height: 0;">&nbsp;</td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin: 0; font-size: 11px; color: #525252; text-align: center;">
                    &copy; ${currentYear} LoopHarvest. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
