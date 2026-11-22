const MIN_SESSION_SECRET_LENGTH = 32;

export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= MIN_SESSION_SECRET_LENGTH ? secret : null;
}
