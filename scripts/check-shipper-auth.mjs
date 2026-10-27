/** Standalone Web Shipper route checks: no passwords and no Web Admin dependency. */
const origin = (process.argv[2] ?? 'http://localhost:3002').replace(/\/+$/, '');
if (!/^https?:\/\//.test(origin)) {
  console.error('Ví dụ: node scripts/check-shipper-auth.mjs http://localhost:3002');
  process.exitCode = 1;
} else {
  for (const [label, path, method, body, expected] of [
    ['Guest session', '/api/auth/me', 'GET', null, 401],
    ['Guest deliveries', '/api/shipper/deliveries', 'GET', null, 401],
    ['Login validation', '/api/auth/sign-in', 'POST', {email:'',password:''}, 400],
  ]) {
    try {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: body ? {'Content-Type':'application/json'} : {},
        body: body ? JSON.stringify(body) : undefined,
        redirect:'manual', signal:AbortSignal.timeout(8000),
      });
      const json = (response.headers.get('content-type') ?? '').includes('application/json');
      console.log(`${label}: HTTP ${response.status}; JSON ${json}`);
      if (response.status !== expected || !json) process.exitCode = 1;
    } catch (error) {
      console.error(`${label}: Cannot reach Web Shipper on 3002 (${error?.name ?? 'NetworkError'})`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log('OK: Web Shipper has its own API on port 3002.');
}
