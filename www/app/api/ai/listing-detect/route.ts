import { NextRequest, NextResponse } from "next/server";

import {
  buildListingDetectionPrompt,
  parseListingDetectionContent,
} from "@/lib/ai/listing-detection";
import { getServerSecret } from "@/lib/server/env";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

type ListingDetectPayload = {
  photoUrl?: string;
};

const LISTING_DETECTION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    category_slug: {
      type: "STRING",
      enum: [
        "food-scraps",
        "spent-grain",
        "coffee-grounds",
        "vegetable-scraps",
        "fruit-waste",
        "surplus-meals",
        "unknown",
      ],
    },
    title: {
      type: "STRING",
    },
    description: {
      type: "STRING",
    },
  },
  required: ["category_slug", "title", "description"],
} as const;

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

function isSafeRemoteImageUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getGatewayBaseUrl() {
  const configuredUrl =
    process.env.AI_GATEWAY_BASE_URL?.trim() ||
    process.env.GATEWAY_BASE_URL?.trim() ||
    "http://localhost:8001";

  return configuredUrl.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("You need to be signed in to auto-detect listing details.", 401);
  }

  let payload: ListingDetectPayload;
  try {
    payload = (await request.json()) as ListingDetectPayload;
  } catch {
    return jsonError("Invalid listing detection payload.", 400);
  }

  const photoUrl = payload.photoUrl?.trim() ?? "";
  if (!photoUrl || !isSafeRemoteImageUrl(photoUrl)) {
    return jsonError("A valid uploaded photo URL is required for auto-detect.", 400);
  }

  const gatewayApiKey =
    getServerSecret("AI_GATEWAY_API_KEY") ||
    getServerSecret("MY_API_KEY");
  if (!gatewayApiKey) {
    return jsonError("AI listing detection is not configured on this server.", 503);
  }

  const gatewayResponse = await fetch(`${getGatewayBaseUrl()}/v1/vision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": gatewayApiKey,
    },
    body: JSON.stringify({
      prompt: buildListingDetectionPrompt(),
      images: [
        {
          source: photoUrl,
        },
      ],
      temperature: 0,
      max_tokens: 512,
      response_mime_type: "application/json",
      response_schema: LISTING_DETECTION_RESPONSE_SCHEMA,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!gatewayResponse?.ok) {
    return jsonError(
      "Auto-detect could not analyze this photo right now. Continue with manual details.",
      502,
    );
  }

  const gatewayPayload = (await gatewayResponse.json()) as {
    content?: string;
  };

  const parsedResult = parseListingDetectionContent(gatewayPayload.content ?? "");
  if (!parsedResult) {
    console.error("Listing detection parse failed", {
      photoUrl,
      gatewayContent: gatewayPayload.content ?? null,
    });
    return jsonError(
      "Auto-detect could not confidently classify this photo. Continue with manual details.",
      422,
    );
  }

  return NextResponse.json({
    success: true,
    data: parsedResult,
  });
}
