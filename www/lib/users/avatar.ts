export function isGeneratedAvatarUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return (
    value.includes("www.gravatar.com/avatar/") ||
    value.includes("secure.gravatar.com/avatar/") ||
    value.includes("api.dicebear.com") ||
    value.includes("/avataaars/")
  );
}
