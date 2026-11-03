// Read-only deployment checks: run after the Vercel production deployment.
const sites = process.argv.slice(2);
if (!sites.length) {
  console.error("Usage: node scripts/check-pwa-deployment.mjs https://your-client-domain https://your-shipper-domain");
  process.exitCode = 2;
} else {
  let failures = 0;
  for (const input of sites) {
    try {
      const url = new URL(input);
      if (url.protocol !== "https:") throw new Error("Production PWA requires HTTPS");
      const base = url.origin;
      const get = async (path) => fetch(new URL(path, base), { redirect: "follow", signal: AbortSignal.timeout(15000), cache: "no-store" });
      const page = await get("/");
      const html = await page.text();
      if (!page.ok) throw new Error(`Root page HTTP ${page.status}`);
      if (!/rel=["']manifest["']|manifest\.webmanifest/i.test(html)) throw new Error("No manifest link found in HTML");
      const response = await get("/manifest.webmanifest");
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const manifest = await response.json();
      if (!manifest.name && !manifest.short_name) throw new Error("Manifest name missing");
      if (!["standalone","minimal-ui","fullscreen"].includes(manifest.display)) throw new Error("Manifest display not standalone");
      if (!manifest.start_url) throw new Error("Manifest start_url missing");
      const icons = manifest.icons ?? [];
      for (const size of [192, 512]) {
        const match = icons.find(i => new RegExp(`(^|\\s)${size}x${size}(\\s|$)`).test(i.sizes || ""));
        if (!match) throw new Error(`Missing ${size}x${size} icon entry`);
        const iconRes = await get(match.src);
        if (!iconRes.ok || !(iconRes.headers.get("content-type") || "").includes("image/")) throw new Error(`Icon ${size} invalid: HTTP ${iconRes.status}`);
      }
      const sw = await get("/sw.js");
      if (!sw.ok || !(await sw.text()).includes("serviceWorker") && !(sw.headers.get("content-type") || "").includes("javascript"))
        throw new Error(`Service worker fetch failed: ${sw.status}`);
      const offline = await get("/offline.html");
      if (!offline.ok) throw new Error(`Offline page HTTP ${offline.status}`);
      console.log(`PASS ${base}: manifest, icons, HTTPS, service worker asset, offline shell`);
      console.log("NOTE: Browser/device WebAPK eligibility and installation prompt cannot be verified by HTTP alone.");
    } catch (error) {
      failures++;
      console.error(`FAIL ${input}: ${error.message}`);
    }
  }
  if (failures) process.exitCode = 1;
}
