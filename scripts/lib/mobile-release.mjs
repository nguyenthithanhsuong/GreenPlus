// Read-only PWA/TWA release gates, intentionally dependency-free for CI.
export const APP_IDS = Object.freeze({
  client: 'com.greenplus.client',
  shipper: 'com.greenplus.shipper',
});

const SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i;
const PACKAGE = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}$/;

export function isValidPackageId(value) {
  return typeof value === 'string' && PACKAGE.test(value);
}
export function normalizeOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw Error('Use a deployed HTTPS origin such as https://client.example.com/'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash || url.port) {
    throw Error('Expected a public HTTPS origin without path, credentials, query, fragment or port');
  }
  return url.origin;
}
export function validateManifest(m, origin) {
  if (!m || typeof m !== 'object') throw Error('PWA manifest is not JSON object');
  if (!(typeof m.name === 'string' && m.name.trim()) && !(typeof m.short_name === 'string' && m.short_name.trim()))
    throw Error('Manifest lacks a name');
  if (!['standalone','fullscreen','minimal-ui'].includes(m.display))
    throw Error('Manifest display is not installable');
  if (m.prefer_related_applications === true) throw Error('Manifest redirects installation to related applications');
  const base = `${origin}/manifest.webmanifest`;
  for (const key of ['start_url','scope']) {
    if (typeof m[key] !== 'string' || !m[key]) throw Error(`Manifest lacks ${key}`);
    const url = new URL(m[key], base);
    if (url.origin !== origin) throw Error(`Manifest ${key} points outside production origin`);
  }
  const start = new URL(m.start_url, base), scope = new URL(m.scope, base);
  if (!start.pathname.startsWith(scope.pathname)) throw Error('Manifest start_url is outside scope');
  for (const size of [192, 512]) {
    const icon = m.icons?.find(i =>
      typeof i?.src === 'string' && i.sizes?.split(/\s+/).includes(`${size}x${size}`) && i.type === 'image/png');
    if (!icon) throw Error(`Manifest lacks ${size}x${size} PNG icon`);
    if (new URL(icon.src, base).origin !== origin) throw Error(`Icon ${size} points outside production origin`);
  }
  return m.icons;
}
export function verifyAssetLinks(statements, packageName) {
  if (!isValidPackageId(packageName)) throw Error('Invalid Android package name');
  if (!Array.isArray(statements) || !statements.some((s) =>
    Array.isArray(s?.relation) && s.relation.includes('delegate_permission/common.handle_all_urls') &&
    s?.target?.namespace === 'android_app' && s.target.package_name === packageName &&
    Array.isArray(s.target.sha256_cert_fingerprints) &&
    s.target.sha256_cert_fingerprints.some(sha => SHA256.test(sha)))) {
    throw Error(`Digital Asset Links missing valid signing certificate for ${packageName}`);
  }
}

/** PWA is verifiable before Android signing; TWA requires asset links. Never asserts a device installed it. */
export async function checkMobileRelease(input, {
  app, twa = false, packageName = APP_IDS[app], fetchImpl = fetch,
} = {}) {
  if (!Object.hasOwn(APP_IDS, app)) throw Error('Specify client or shipper app');
  const origin = normalizeOrigin(input);
  const check = async (path) => {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw Error('Cross-origin asset URL rejected');
    const response = await fetchImpl(url.href, {
      redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || response.status >= 300 || response.status < 200)
      throw Error(`${url.pathname}: HTTP ${response.status} (auth redirects are not allowed)`);
    return response;
  };
  const document = await check('/');
  const html = await document.text();
  if (!/rel=["']manifest["']|manifest\.webmanifest/i.test(html)) throw Error('Root HTML has no manifest link');
  const manifestResponse = await check('/manifest.webmanifest');
  if (!(manifestResponse.headers.get('content-type') || '').includes('json'))
    throw Error('Manifest is not served as JSON');
  const manifest = await manifestResponse.json();
  const icons = validateManifest(manifest, origin);
  for (const size of [192, 512]) {
    const icon = icons.find(i => i.sizes?.split(/\s+/).includes(`${size}x${size}`) && i.type === 'image/png');
    const response = await check(new URL(icon.src, `${origin}/manifest.webmanifest`).pathname);
    if (!(response.headers.get('content-type') || '').startsWith('image/png')) throw Error(`Icon ${size} not PNG`);
  }
  const sw = await check('/sw.js');
  if (!/(?:javascript|ecmascript)/.test(sw.headers.get('content-type') || '')) throw Error('Service worker served with wrong MIME type');
  if (!/no-cache|no-store/.test(sw.headers.get('cache-control') || '')) throw Error('Service worker must not be HTTP cached');
  const script = await sw.text();
  if (!script.includes('addEventListener') || !script.includes('fetch')) throw Error('Invalid service worker source');
  const offline = await check('/offline.html');
  if (!(offline.headers.get('content-type') || '').includes('html')) throw Error('Offline document must be HTML');
  if (twa) {
    const links = await check('/.well-known/assetlinks.json');
    if (!(links.headers.get('content-type') || '').includes('json')) throw Error('Digital Asset Links must be JSON');
    verifyAssetLinks(await links.json(), packageName);
  }
  return { origin, app, twa, packageName: twa ? packageName : null };
}
