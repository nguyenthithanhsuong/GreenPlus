
import fs from "node:fs";
import path from "node:path";

const apps = [
  { name: "Client", folder: "web-client", port: 3000 },
  { name: "Admin", folder: "web-admin", port: 3001 },
  { name: "Shipper", folder: "web-shipper", port: 3002 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function discoverRoutes(folder) {
  const root = path.join(process.cwd(), folder, "src", "app");
  const routes = new Set();

  if (!fs.existsSync(root)) return [];

  function walk(dir, segments = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    if (entries.some((entry) => /^page\.(tsx|jsx|ts|js)$/.test(entry.name))) {
      routes.add("/" + segments.join("/"));
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const name = entry.name;

      if (
        name.startsWith("@") ||
        name.startsWith("_") ||
        name.startsWith("[") ||
        name.startsWith("(.")
      ) {
        continue;
      }

      const isRouteGroup = name.startsWith("(") && name.endsWith(")");

      walk(
        path.join(dir, name),
        isRouteGroup ? segments : [...segments, name]
      );
    }
  }

  walk(root);
  return [...routes].sort();
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
      });
      return true;
    } catch {
      await sleep(1000);
    }
  }

  return false;
}

for (const app of apps) {
  const baseUrl = `http://localhost:${app.port}`;

  console.log(`\n[${app.name}] Waiting for ${baseUrl}`);

  if (!(await waitForServer(baseUrl))) {
    console.log(`[${app.name}] Server unavailable, skipping.`);
    continue;
  }

  const routes = discoverRoutes(app.folder);

  console.log(`[${app.name}] Found ${routes.length} static routes.`);

  for (const route of routes) {
    try {
      const response = await fetch(baseUrl + route, {
        redirect: "manual",
        signal: AbortSignal.timeout(90000),
      });

      console.log(
        `[${app.name}] ${response.status} ${route}`
      );
    } catch (error) {
      console.log(
        `[${app.name}] Failed ${route}: ${error.message}`
      );
    }
  }

  console.log(`[${app.name}] Pre-warming finished.`);
}

console.log("\nGreenPlus development pre-warming completed.");
