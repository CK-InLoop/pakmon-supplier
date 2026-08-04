import { createHash } from 'crypto';

const RESET_PREFIX = 'password-reset:';

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function resetIdentifier(email: string) {
  return `${RESET_PREFIX}${email.trim().toLowerCase()}`;
}

export function emailFromResetIdentifier(identifier: string) {
  return identifier.startsWith(RESET_PREFIX)
    ? identifier.slice(RESET_PREFIX.length)
    : null;
}
