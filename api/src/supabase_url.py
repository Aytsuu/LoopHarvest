from __future__ import annotations

from urllib.parse import urlparse


def normalize_supabase_project_url(raw_url: str | None) -> str | None:
    if not raw_url:
        return None

    value = raw_url.strip().rstrip("/")
    if not value:
        return None

    if value.startswith("http://") or value.startswith("https://"):
        parsed = urlparse(value)
        host = parsed.netloc
        if not host:
            return None
        return f"{parsed.scheme}://{host}"

    if value.startswith("postgresql://") or value.startswith("postgres://"):
        parsed = urlparse(value)
        host = parsed.hostname or ""
        ref = _extract_project_ref(host)
        if ref:
            return f"https://{ref}.supabase.co"

    return value


def _extract_project_ref(host: str) -> str | None:
    parts = host.split(".")
    if len(parts) < 2:
        return None

    if parts[0] == "postgres" and len(parts) >= 2:
        return parts[1]

    return parts[0] if parts[-2:] == ["supabase", "co"] else None
