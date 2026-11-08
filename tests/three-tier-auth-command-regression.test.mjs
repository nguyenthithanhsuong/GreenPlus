import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  assertPostgrestBootstrapConfig,
  redactPostgrestDiagnostics,
  POSTGREST_AUTH_SERVICES,
} from '../scripts/three-tier-compose-auth.mjs';

const root = resolve(import.meta.dirname, '..');
const compose = readFileSync(join(root, 'docker/three-tier/compose.yaml'), 'utf8');

function extractSingleShellArgument(serviceName) {
  const block = compose.split(`  ${serviceName}:\n`)[1]?.split(/\n  [a-z][\w-]*:\n/)[0];
  assert.ok(block, `missing ${serviceName}`);
  assert.match(block, /entrypoint: \["\/bin\/sh", "-ec"\]/);
  const args = block.match(/\n    command:\n      - >-\n((?:        [^\n]*\n)+)/);
  assert.ok(args, `${serviceName} must use a one-item exec-form command list, not a scalar`);
  return args[1].trim().split(/\n\s+/).join(' ');
}

for (const serviceName of POSTGREST_AUTH_SERVICES) {
  test(`${serviceName} passes the whole psql command to sh -ec`, () => {
    const command = extractSingleShellArgument(serviceName);
    assert.match(command, /^exec psql -q -h /);
    assert.match(command, /-v ON_ERROR_STOP=1/);
    assert.match(command, /-v "rest_password=\$\$\{DEMO_POSTGREST_PASSWORD\}"/);
    assert.match(command, /-f \/sql\/auth\/005_postgrest_authenticator\.sql$/);
  });
}

test('resolved Docker Compose argv must contain exactly ONE complete shell script', () => {
  const good = { services: Object.fromEntries(POSTGREST_AUTH_SERVICES.map(name => [name, {
    entrypoint: ['/bin/sh', '-ec'],
    command: ['exec psql -q -h example -X -v ON_ERROR_STOP=1 -v "rest_password=SECRET" -f /sql/auth/005_postgrest_authenticator.sql'],
  }])) };
  assert.equal(assertPostgrestBootstrapConfig(good), true);
  const stale = structuredClone(good);
  stale.services['shared-rest-auth'].command = ['psql', '-q', '-h', 'shared-db'];
  assert.throws(() => assertPostgrestBootstrapConfig(stale), /shared-rest-auth.*ONE complete/);
  const incomplete = structuredClone(good);
  incomplete.services['enterprise-b-rest-auth'].command = ['psql'];
  assert.throws(() => assertPostgrestBootstrapConfig(incomplete), /enterprise-b-rest-auth.*ONE complete/);
});

test('diagnostics scrub the existing PostgreSQL, PostgREST and gateway credentials', () => {
  const env = [
    'DEMO_POSTGRES_PASSWORD=POSTGRES_KEY_1234567890',
    'DEMO_POSTGREST_PASSWORD=POSTGREST_KEY_1234567890',
    'DEMO_GATEWAY_KEY=GATEWAY_KEY_1234567890',
  ].join('\n');
  const logs = 'postgres=POSTGRES_KEY_1234567890 rest=POSTGREST_KEY_1234567890 gateway=GATEWAY_KEY_1234567890';
  const safe = redactPostgrestDiagnostics(logs, env);
  assert.equal(safe, 'postgres=[REDACTED] rest=[REDACTED] gateway=[REDACTED]');
  assert.equal(redactPostgrestDiagnostics('no key information', env), 'no key information');
});

test('shell actually invokes psql with all arguments and propagates nonzero failures', {skip: process.platform === 'win32'}, () => {
  const temp = mkdtempSync(join(tmpdir(), 'greenplus-postgrest-auth-'));
  try {
    const binDir = join(temp, 'bin');
    mkdirSync(binDir);
    const executable = join(binDir, 'psql');
    writeFileSync(executable, '#!/bin/sh\nprintf "%s\\n" "$@" > "$CAPTURE_FILE"\nexit "${MOCK_PSQL_EXIT:-0}"\n');
    chmodSync(executable, 0o755);
    for (const serviceName of POSTGREST_AUTH_SERVICES) {
      const capture = join(temp, serviceName + '.args');
      const command = extractSingleShellArgument(serviceName).replaceAll('$${DEMO_POSTGREST_PASSWORD}', '${DEMO_POSTGREST_PASSWORD}');
      const env = {
        ...process.env,
        PATH: binDir + ':' + process.env.PATH,
        DEMO_POSTGREST_PASSWORD: '1234567890_mock_secret',
        CAPTURE_FILE: capture,
      };
      const result = spawnSync('sh', ['-ec', command], {env, encoding:'utf8'});
      assert.equal(result.status, 0, `${serviceName}: ${result.stderr}`);
      const args = readFileSync(capture,'utf8').trim().split('\n');
      assert.ok(args.includes('-f'), `${serviceName} omitted SQL file flag`);
      assert.ok(args.includes('/sql/auth/005_postgrest_authenticator.sql'));
      assert.ok(args.includes('rest_password=1234567890_mock_secret'));
      assert.ok(args.includes('ON_ERROR_STOP=1'));
      assert.ok(args.includes('-h'));
      assert.ok(args.includes(serviceName.replace('-rest-auth', '-db')) || (serviceName === 'shared-rest-auth' && args.includes('shared-db')));
      const failure = spawnSync('sh', ['-ec', command], {env: {...env, MOCK_PSQL_EXIT:'2'}, encoding:'utf8'});
      assert.equal(failure.status, 2, `${serviceName}: must fail closed if psql fails`);
    }
  } finally { rmSync(temp, {recursive:true, force:true}); }
});
