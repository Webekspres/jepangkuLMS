import { importSPKI, jwtVerify } from 'jose';

let cachedPublicKey: CryptoKey | null = null;

function envFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function getJwtPublicKeyPem(): string | undefined {
  const raw = envFirst('CORE_JWT_PUBLIC_KEY', 'JEPANGKU_CORE_JWT_PUBLIC_KEY');
  if (!raw) return undefined;
  const pem = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (pem.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'JEPANGKU_CORE_JWT_PUBLIC_KEY must be a PUBLIC KEY — run: cd jepangku-core && bun run jwt:export-public-key',
    );
  }
  return pem;
}

async function getJwtPublicKey(): Promise<CryptoKey> {
  const pem = getJwtPublicKeyPem();
  if (!pem) {
    throw new Error('JEPANGKU_CORE_JWT_PUBLIC_KEY is not configured');
  }

  if (!cachedPublicKey) {
    cachedPublicKey = await importSPKI(pem, 'RS256');
  }

  return cachedPublicKey;
}

export async function verifyCoreJwtToken(token: string): Promise<unknown> {
  const issuer = envFirst('CORE_JWT_ISSUER', 'JEPANGKU_CORE_JWT_ISSUER');
  const audience = envFirst('CORE_JWT_AUDIENCE', 'JEPANGKU_CORE_JWT_AUDIENCE');

  if (!issuer || !audience) {
    throw new Error('JEPANGKU_CORE_JWT_ISSUER and JEPANGKU_CORE_JWT_AUDIENCE are required');
  }

  const { payload } = await jwtVerify(token, await getJwtPublicKey(), {
    issuer,
    audience,
  });

  return payload;
}
