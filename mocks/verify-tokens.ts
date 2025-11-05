export const DEFAULT_VERIFY_TOKEN_TTL_SECONDS = 60;

export interface MockVerifyTokenRecord {
  token: string;
  name: string;
  ci: string;
  expiresAt: number;
  used: boolean;
}

const verifyTokens = new Map<string, MockVerifyTokenRecord>();

function generateOpaqueToken(length = 32): string {
  if (length <= 0) {
    return '';
  }

  const buffer = new Uint8Array(length);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < buffer.length; i += 1) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function removeExpiredTokens(now = Date.now()): void {
  for (const [token, record] of verifyTokens.entries()) {
    if (record.expiresAt <= now || record.used) {
      verifyTokens.delete(token);
    }
  }
}

export function issueMockVerifyToken({
  name,
  ci,
  ttlSeconds = DEFAULT_VERIFY_TOKEN_TTL_SECONDS,
}: {
  name: string;
  ci: string;
  ttlSeconds?: number;
}): MockVerifyTokenRecord {
  removeExpiredTokens();

  const token = generateOpaqueToken(32);
  const record: MockVerifyTokenRecord = {
    token,
    name,
    ci,
    expiresAt: Date.now() + ttlSeconds * 1000,
    used: false,
  };

  verifyTokens.set(token, record);

  return record;
}

export function getMockVerifyToken(token: string): MockVerifyTokenRecord | undefined {
  removeExpiredTokens();

  const record = verifyTokens.get(token);
  if (!record) {
    return undefined;
  }

  if (record.expiresAt <= Date.now()) {
    verifyTokens.delete(token);
    return undefined;
  }

  if (record.used) {
    return undefined;
  }

  return record;
}

export function consumeMockVerifyToken(
  token: string
): { name: string; ci: string } {
  removeExpiredTokens();

  const record = verifyTokens.get(token);

  if (!record) {
    throw new Error('본인인증 토큰이 존재하지 않거나 만료되었습니다.');
  }

  if (record.used) {
    verifyTokens.delete(token);
    throw new Error('본인인증 토큰이 이미 사용되었습니다.');
  }

  if (record.expiresAt <= Date.now()) {
    verifyTokens.delete(token);
    throw new Error('본인인증 토큰이 만료되었습니다.');
  }

  verifyTokens.delete(token);

  return {
    name: record.name,
    ci: record.ci,
  };
}

export function clearMockVerifyTokens(): void {
  verifyTokens.clear();
}
