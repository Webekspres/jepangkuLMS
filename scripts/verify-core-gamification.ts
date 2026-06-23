#!/usr/bin/env bun
/**
 * Smoke test Core gamification + LMS env wiring.
 * Usage: bun run verify:core-gamification
 */
import 'dotenv/config';

const coreUrl = process.env.JEPANGKU_CORE_API_URL?.replace(/\/$/, '');
const serviceToken = process.env.JEPANGKU_CORE_SERVICE_TOKEN;
const jwtPublicKey = process.env.JEPANGKU_CORE_JWT_PUBLIC_KEY;

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function add(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
}

add('JEPANGKU_CORE_API_URL', Boolean(coreUrl), coreUrl ?? 'missing');
add(
  'JEPANGKU_CORE_SERVICE_TOKEN',
  Boolean(serviceToken && serviceToken !== 'YOUR_CORE_SERVICE_TOKEN'),
  serviceToken ? 'set' : 'missing',
);
add(
  'JEPANGKU_CORE_JWT_PUBLIC_KEY',
  Boolean(jwtPublicKey && !jwtPublicKey.includes('YOUR_BASE64')),
  jwtPublicKey ? 'set' : 'missing',
);

if (coreUrl) {
  try {
    const healthRes = await fetch(`${coreUrl}/health`, { cache: 'no-store' });
    const healthBody = await healthRes.text();
    add('Core /health', healthRes.ok, `${healthRes.status} ${healthBody.slice(0, 120)}`);
  } catch (error) {
    add('Core /health', false, String(error));
  }
}

if (coreUrl && serviceToken && serviceToken !== 'YOUR_CORE_SERVICE_TOKEN') {
  try {
    const probeRes = await fetch(`${coreUrl}/api/v1/gamification/award`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({
        userId: 'verify_probe_user',
        application: 'LMS',
        activityType: 'COMPLETED_LESSON',
        xpGained: 0,
        idempotencyKey: `lms:verify:${Date.now()}`,
      }),
      cache: 'no-store',
    });
    const probeText = await probeRes.text();
    const reachable =
      probeRes.status === 400 ||
      probeRes.status === 404 ||
      probeRes.status === 422 ||
      probeRes.status === 200;
    add(
      'Core award endpoint reachable',
      reachable,
      `${probeRes.status} ${probeText.slice(0, 160)}`,
    );
  } catch (error) {
    add('Core award endpoint reachable', false, String(error));
  }
}

console.log('\n=== JepangKu LMS — Core Gamification Verification ===\n');
for (const check of checks) {
  console.log(`${check.ok ? '✅' : '❌'} ${check.name}: ${check.detail}`);
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
