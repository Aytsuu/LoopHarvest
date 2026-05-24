import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSecret } from "@/lib/server/env";
import { getSupabaseEnv } from "@/lib/supabase/env";

const REQUIRED_SERVICE_ROLE_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY is required for server-side account management.";

export function getSupabaseAdminEnv() {
  const { url, publishableKey } = getSupabaseEnv();
  const serviceRoleKey = getServerSecret("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error(REQUIRED_SERVICE_ROLE_MESSAGE);
  }

  return {
    url,
    publishableKey,
    serviceRoleKey,
  };
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    db: {
      schema: "api",
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseSignupClient() {
  const { url, publishableKey } = getSupabaseAdminEnv();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
