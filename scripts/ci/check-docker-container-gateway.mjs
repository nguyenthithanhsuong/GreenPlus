/** Executed INSIDE the web-admin container, using only server runtime env vars. */
import { dockerGatewayConfiguration, dockerGatewayReadiness } from '../../web-admin/backend/core/docker-gateway.mjs';
const config = dockerGatewayConfiguration(process.env);
if (!config.configured || config.mode !== 'internal') {
  console.error('FAIL: Admin is not configured for the private Docker gateway.');
  process.exitCode = 1;
} else {
  const state = await dockerGatewayReadiness();
  if (!state.ready) {
    console.error('FAIL: Admin cannot authenticate to gateway on its Docker network.');
    process.exitCode = 1;
  } else console.log('PASS: Admin → private Docker gateway /ready + authenticated /stores.');
}
