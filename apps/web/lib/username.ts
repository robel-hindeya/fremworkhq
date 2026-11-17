/**
 * Accounts made with a username instead of an email.
 *
 * Supabase Auth needs an email for every account, so a username account is stored under a
 * placeholder address on a domain that never receives mail. The placeholder is created already
 * confirmed (no email is ever sent) and is hidden wherever the app would show or mail an address.
 */
export const USERNAME_DOMAIN = 'users.fremwork.invalid';

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,23}$/;
const RESERVED = new Set(['admin', 'administrator', 'owner', 'root', 'support', 'system', 'api', 'help', 'security']);

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

/** A plain-language problem with the username, or '' when it is fine. */
export function usernameProblem(value: string): string {
  const u = normalizeUsername(value);
  if (!USERNAME_RE.test(u)) return 'Use 3–24 letters, numbers, dots, dashes or underscores, starting with a letter or number.';
  if (RESERVED.has(u)) return 'That username is reserved. Pick another one.';
  return '';
}

export const usernameEmail = (username: string) => `${normalizeUsername(username)}@${USERNAME_DOMAIN}`;

/** True for the placeholder address of a username account. */
export const isUsernameEmail = (email: string | null | undefined) => !!email && email.toLowerCase().endsWith(`@${USERNAME_DOMAIN}`);

/** "maya" for a username account, the email itself otherwise. */
export const displayLogin = (email: string | null | undefined) =>
  isUsernameEmail(email) ? email!.slice(0, -(USERNAME_DOMAIN.length + 1)) : email ?? '';
