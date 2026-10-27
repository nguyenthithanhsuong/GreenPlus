# GreenPlus Web Shipper: embedded OpenStreetMap (changes only)

## What this patch changes

- Replaces external Google Maps link in Web Shipper's delivery cards with an embedded map modal on port **3002**.
- Uses **React Leaflet + OpenStreetMap raster tiles**, with visible OSM credit. No Google Maps API key or additional `.env` file.
- Fetches the pickup/store coordinates (if available) through Shipper's own authenticated `/api/shipper/deliveries/:orderId/map` endpoint.
- Does not geocode private customer addresses. Destination is **manually pinned** on the map; pickup can also be pinned if store coordinates are absent or inaccurate.
- Optional **GPS on demand** shows the shipper's current position locally in the browser. It does **not** stream/save GPS to Supabase, and stops watching when disabled or when the map closes.
- Straight dashed line indicates **straight-line distance**, NOT driving distance, directions, or delivery fee.
- In `next dev` only, an explicit **OSRM demo route** button may fetch driving geometry on a public OSRM instance through a local rate-limited API; it is disabled for production. There is **no guarantee of availability** and it must not be used for live driver navigation.
- Does not modify the Supabase schema or any customer/order data.

## Apply

Extract the changes-only ZIP into the existing GreenPlus repository with previous fixes applied.

Run from **GreenPlus root** (PowerShell/VS Code):

```powershell
npm install -w web-shipper
npm run dev:shipper
```

`npm install -w web-shipper` updates `package-lock.json` to include the new dependencies. **Commit the updated lockfile** along with the patch; it is intentionally not supplied because this execution environment cannot reach npm registry to generate a verified lockfile. For CI using `npm ci`, updating the lockfile is mandatory.

Required existing variables in **root `.env`**: Supabase URL, server-only Supabase service role key and the Shipper session secret. No new map key or separate env file is needed.

Navigate to `http://localhost:3002`, sign in as Shipper, click **Bản đồ** on one of your assigned orders, then:

1. See store pickup pin if `stores.latitude/longitude` exists.
2. Select **Ghim điểm giao** and click the accurate delivery location on the map; use the textual customer address for reference.
3. If pickup location is missing, select **Sửa điểm lấy** and click pickup.
4. Click **Bật GPS** if desired. Geolocation on `localhost` works as a secure-context exception; for an online domain use HTTPS.
5. Optional local development: **Thử tuyến đường OSRM** to request a driving route. This sends two coordinates to the public demo service.

Run regression tests:

```powershell
npm test -w web-shipper
npm run typecheck -w web-shipper
npm run build -w web-shipper
```

## Important operational notes

- OSM **map data** is open, but `tile.openstreetmap.org` servers are donation-funded, limited-capacity **development/small-traffic infrastructure**, not a free unlimited production map service. Follow their tile policy, keep attribution and browser Referer, respect tile caching, and do not implement offline downloads or prefetch. For production, use a compliant tile provider or self-host.
  https://operations.osmfoundation.org/policies/tiles/
- OSRM demo is **development-only**. For production routing, deploy your own OSRM/GraphHopper/Valhalla instance or choose a service with suitable SLA and terms. No real turn-by-turn navigation or multi-stop optimization in this patch.
- The public OSRM service sees two coordinates whenever the shipper explicitly requests a demo route. A customer address string is **never transmitted to that service** by this patch.
- Destination pins are ephemeral. For accurate production routing, the Customer checkout should capture and store verified delivery coordinates in a dedicated order column, with an appropriate migration and privacy controls. This patch intentionally does not alter the DB.
- Security: the map endpoint verifies active Shipper session, assignment to the order, active `store_members` and delivery/order store match. Public route endpoint also requires authentication, checks origin, throttles per shipper in-memory, is development-only.
- Build/TS TypeCheck on this patch **not verified** in the current tool environment due to missing node_modules/npm registry access; test `node --test` checks geospatial contracts and static authorization gates only.
