# GreenPlus developer commands (November 2026)

The root `package.json` exposes **25** commands. Underlying Docker/PWA/CI programs were **not deleted**; advanced operations are grouped under subcommands. Existing CI aliases `docker:three-tier:up` and `docker:three-tier:check` remain stable, as do `test:client`, `test:release:static`, and `check-all` (required by regression checks).

## Development and the Turbo interface

Run from an **interactive VS Code terminal**, not an output panel or a process with redirected stdin:

```powershell
npm run dev:all          # Three web apps, interactive Turbo TUI, no Docker bootstrap
npm run dev:web          # Same as dev:all
npm run dev              # Check/start local three-tier Docker, then Turbo TUI
npm run dev:admin        # Admin only, port 3000
npm run dev:client       # Client only, port 3001
npm run dev:shipper      # Shipper only, port 3002
```

If the screen used to have a task picker and live per-app logs, that was Turbo's `tui` mode. The old `dev:all` invoked `concurrently` and forced `--ui=stream`; the new command runs Turbo **directly** with `--ui=tui` so stdin/stdout are attached to the terminal. If the terminal cannot provide a TTY, use `npx turbo dev --ui=stream` explicitly.

**Route prewarming is no longer automatic** because its HTTP status messages would interfere with the TUI. Once the apps are serving, open a **second terminal** and run:

```powershell
node scripts/prewarm-dev.mjs
```

## Quality

```powershell
npm run test                  # Root + Client + Shipper static tests, CI config validation
npm run lint
npm run typecheck
npm run build                 # Three production builds
npm run check-all             # lint + typecheck + tests + build, no source fixes
npm run fix:local             # SOURCE-MUTATING: Prettier writes + ESLint --fix
```

`npm run check:ci` and `npm run test:release:static` are retained as CI-compatible names. Run `npm run test:client` to isolate Client tests.

## Docker three-tier

```powershell
npm run docker -- init
npm run docker -- up
npm run docker -- check
npm run docker -- ps
npm run docker -- link-admin
npm run docker -- check-admin
npm run docker -- apps:up
npm run docker -- apps:check
npm run docker -- apps:down
npm run docker -- down
npm run docker -- test:commerce
npm run docker -- test:transactions
npm run docker -- test:lifecycle
```

CI also retains the stable `npm run docker:three-tier:up` and `npm run docker:three-tier:check` aliases. Docker `down` preserves volumes; **never use** `docker compose down -v` when you need to preserve data. Integration checks can require a running sandbox.

## Mobile PWA/TWA

```powershell
npm run mobile -- client preflight https://YOUR-CLIENT-DOMAIN/
npm run mobile -- shipper preflight https://YOUR-SHIPPER-DOMAIN/
npm run mobile -- client init https://YOUR-CLIENT-DOMAIN/
npm run mobile -- shipper init https://YOUR-SHIPPER-DOMAIN/
npm run mobile -- client assetlinks AA:BB:...:ZZ
npm run mobile -- client check https://YOUR-CLIENT-DOMAIN/
npm run mobile -- shipper build
npm run mobile -- shipper install
```

The `preflight` action is a read-only HTTPS PWA check. `init`, `assetlinks`, `build`, `install` are Bubblewrap actions, **not** Flutter; they require a configured Android environment and appropriate signing setup. No command automatically publishes a build to Google Play.

## Packaging and recovery

```powershell
npm run clean:zip         # Delete generated workspace build/cache files for packaging
npm run zip:source        # ZIP source only, excluding secrets and dependencies
npm run maintain -- scan # Read-only, lists vetted legacy candidates
npm run maintain -- clean  # Dry run
npm run maintain -- restore --batch=BATCH_ID
npm run maintain:restore # Recovery shortcut (latest batch)
```

Maintenance `all`/`apply` actions are still available via `npm run maintain -- all --apply --zip`; they **modify the working tree** and can be blocked by Windows file locks. The 20 legacy candidates were already removed in the most recent successful cleanup. Do not re-run source deletion just because the CLI remains available.

`npm ci` remains compatible: only package scripts changed, not dependency versions or the package lockfile.
