export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAllowed(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  if (!email) return false;
  return allowlist.includes(email.toLowerCase());
}
