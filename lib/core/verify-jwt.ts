import { importSPKI, jwtVerify } from 'jose';

let cachedPublicKey: CryptoKey | null = null;

function getJwtPublicKeyPem(): string | undefined {
  const raw = process.env.JEPANGKU_CORE_JWT_PUBLIC_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
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
  const issuer = process.env.JEPANGKU_CORE_JWT_ISSUER;
  const audience = process.env.JEPANGKU_CORE_JWT_AUDIENCE;

  if (!issuer || !audience) {
    throw new Error('JEPANGKU_CORE_JWT_ISSUER and JEPANGKU_CORE_JWT_AUDIENCE are required');
  }

  const { payload } = await jwtVerify(token, await getJwtPublicKey(), {
    issuer,
    audience,
  });

  return payload;
}
