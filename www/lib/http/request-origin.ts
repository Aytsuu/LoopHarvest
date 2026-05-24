import type { NextRequest } from "next/server";

function normalizeProto(proto: string | null | undefined, fallback: string) {
  if (!proto) {
    return fallback;
  }

  return proto.replace(/:$/, "");
}

function resolveHost(request: NextRequest) {
  return request.headers.get("x-forwarded-host")
    ?? request.headers.get("host")
    ?? request.nextUrl.host;
}

export function resolveRequestOrigin(request: NextRequest) {
  const protocol = normalizeProto(
    request.headers.get("x-forwarded-proto"),
    request.nextUrl.protocol.replace(/:$/, ""),
  );
  const host = resolveHost(request);

  return `${protocol}://${host}`;
}

export function buildRequestUrl(request: NextRequest, pathname: string) {
  const url = new URL(pathname, resolveRequestOrigin(request));
  return url;
}
