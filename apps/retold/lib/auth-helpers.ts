/**
 * Returns true if sign-in should be allowed for the given email.
 *
 * - When allowedEmails is empty: open signup (allow everyone)
 * - When allowedEmails is non-empty: closed beta (allow only listed emails)
 */
export function isEmailAllowed(email: string, allowedEmails: string[]): boolean {
  if (!email) return false;
  if (allowedEmails.length === 0) return true;
  return allowedEmails.includes(email);
}
