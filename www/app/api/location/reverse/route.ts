import { NextRequest, NextResponse } from "next/server";

function parseCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = parseCoordinate(searchParams.get("lat"));
  const longitude = parseCoordinate(searchParams.get("lon"));

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: { message: "Latitude and longitude are required." } },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "LoopHarvest/1.0 location-resolution",
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: { message: "Unable to resolve your current region." } },
      { status: 502 },
    );
  }

  const payload = (await upstream.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      county?: string;
      country?: string;
    };
  };

  const address = payload.address;
  const region =
    address?.city ??
    address?.town ??
    address?.village ??
    address?.state ??
    address?.county ??
    null;
  const country = address?.country ?? null;

  if (!region && !country) {
    return NextResponse.json(
      { error: { message: "Unable to resolve your current region." } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    region,
    country,
    location: [region, country].filter(Boolean).join(", "),
  });
}
