/** Parse-time safety gate and secret-safe diagnostics for Docker PostgREST bootstrap. */
export const POSTGREST_AUTH_SERVICES = [
  'shared-rest-auth',
  'enterprise-a-rest-auth',
  'enterprise-b-rest-auth',
];

export function assertPostgrestBootstrapConfig(composeConfig) {
  const services = composeConfig?.services;
  for (const serviceName of POSTGREST_AUTH_SERVICES) {
    const service = services?.[serviceName];
    const entrypoint = service?.entrypoint;
    const command = service?.command;
    // docker compose concatenates entrypoint + command arrays. A scalar command
    // is split into tokens, so `sh -ec` executes only `psql`, dropping flags.
    if (
      !Array.isArray(entrypoint) ||
      entrypoint.length !== 2 ||
      entrypoint[0] !== '/bin/sh' ||
      entrypoint[1] !== '-ec' ||
      !Array.isArray(command) ||
      command.length !== 1 ||
      !/^exec psql\s/.test(command[0]) ||
      !command[0].includes('-v ON_ERROR_STOP=1') ||
      !command[0].includes('-f /sql/auth/005_postgrest_authenticator.sql') ||
      !command[0].includes('rest_password=')
    ) {
      throw new Error(`Invalid ${serviceName} bootstrap command: /bin/sh -ec must receive ONE complete psql script argument. Check docker/three-tier/compose.yaml.`);
    }
  }
  return true;
}

/** No Docker credentials are copied into printed failure diagnostics. */
export function redactPostgrestDiagnostics(logs, dockerEnv) {
  let output = String(logs);
  for (const key of ['DEMO_POSTGRES_PASSWORD', 'DEMO_POSTGREST_PASSWORD', 'DEMO_GATEWAY_KEY']) {
    const matches = [...String(dockerEnv).matchAll(new RegExp(`^\\s*${key}\\s*=([^\\r\\n]*)`, 'gm'))];
    if (matches.length === 1 && matches[0][1].length >= 8) {
      output = output.replaceAll(matches[0][1], '[REDACTED]');
    }
  }
  return output;
}
