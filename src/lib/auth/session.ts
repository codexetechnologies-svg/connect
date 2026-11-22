export type SessionRole = 'supplier' | 'medical-shop' | 'admin';

export type AppSession = {
  id: string;
  role: SessionRole;
  authMethod: 'email-otp';
  approved: true;
  exp: number;
};

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function signSession(session: AppSession, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const payload = encodeBase64Url(encoder.encode(JSON.stringify(session)));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(value: string | undefined, secret: string): Promise<AppSession | null> {
  if (!value || value.length > 2048) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = value.slice(0, separator);
  const signature = decodeBase64Url(value.slice(separator + 1));
  const payloadBytes = decodeBase64Url(payload);
  if (!signature || !payloadBytes) return null;

  const signatureBuffer = new ArrayBuffer(signature.length);
  new Uint8Array(signatureBuffer).set(signature);

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(payload)
    );
    if (!validSignature) return null;

    const parsed: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (!parsed || typeof parsed !== 'object') return null;

    const session = parsed as Partial<AppSession>;
    const validRole =
      session.role === 'supplier' || session.role === 'medical-shop' || session.role === 'admin';
    if (
      typeof session.id !== 'string' ||
      session.id.length === 0 ||
      session.id.length > 64 ||
      !validRole ||
      session.authMethod !== 'email-otp' ||
      session.approved !== true ||
      typeof session.exp !== 'number' ||
      !Number.isSafeInteger(session.exp) ||
      session.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return session as AppSession;
  } catch {
    return null;
  }
}
