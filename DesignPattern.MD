# GreenPlus API Setup Review and Design Pattern Proposal

## 1. Current API Setup (Frontend and Backend)

### What is in place now
- `web-admin/src/app/page.tsx` renders `web-admin/frontend/page.tsx`.
- `web-client/src/app/page.tsx` renders `web-client/frontend/page.tsx`.
- Both `web-admin/frontend/page.tsx` and `web-client/frontend/page.tsx` are currently placeholder pages.
- There are large interactive data pages in `web-admin/backend/page.tsx` and `web-client/backend/page.tsx` that:
  - run in the browser (`"use client"`),
  - call Supabase directly from UI components,
  - perform select/insert/update/delete directly in page components.
- `web-admin/src/lib/supabaseClient.ts` and `web-client/src/lib/supabaseClient.ts` initialize Supabase with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Important implications
- There is no clear API boundary between UI and data access yet; UI components currently contain query and mutation logic.
- "backend" folders are not currently wired into Next.js routing from `src/app`, so they behave as modules, not active backend route handlers.
- Logic is duplicated between admin and client apps, especially data loading and CRUD patterns.
- With anon key usage in browser, security must rely heavily on Supabase RLS policies.

## 2. Recommended 6 Patterns (2 per Category)

### Creational Pattern 1: Factory Method
- Use factory functions to build repositories and services based on app context (admin/client), table, and auth scope.
- Example: `createRepository("orders", { app: "admin" })` returns a repository with admin-safe defaults.

Why this fits now:
- You have repeated setup logic in both apps.
- Factory Method standardizes how dependencies are created without coupling UI to constructors.

### Creational Pattern 2: Abstract Factory
- Define a factory per app surface: `AdminDataFactory` and `ClientDataFactory`.
- Each factory creates a consistent family: repositories, validators, serializers, and policies.

Why this fits now:
- Admin and client have different permissions and data views.
- Abstract Factory ensures each app gets the correct compatible components.

### Structural Pattern 1: Facade
- Add a `DataFacade` between API/UI and domain modules.
- Expose simple methods such as `getDashboardMetrics`, `listProducts`, `approveSupplier`, `trackOrder`.

Why this fits now:
- Current page components call many low-level operations directly.
- Facade simplifies call sites and creates a stable API surface for refactors.

### Structural Pattern 2: Adapter
- Wrap Supabase-specific calls in adapters (query, mutation, rpc, storage).
- Keep Supabase response formats inside adapters; return app-owned DTOs outward.

Why this fits now:
- Reduces direct Supabase SDK dependency throughout feature code.
- Makes provider changes and test mocking much easier.

### Behavioral Pattern 1: Strategy
- Replace table-specific branching with strategy objects per feature/table.
- Example: `ordersStrategy`, `inventoryStrategy`, `usersStrategy` each define validation, filtering, and mutation guards.

Why this fits now:
- You already have `TABLE_CRUD_PRESETS`, which is strategy-like.
- Strategy keeps rules modular as data workflows grow.

### Behavioral Pattern 2: Command
- Model mutations as command objects: `CreateOrderCommand`, `UpdateInventoryCommand`, `ApproveSupplierCommand`.
- Each command handles validation, execution, and optional audit metadata.

Why this fits now:
- Insert/update/delete are currently embedded in page logic.
- Command centralizes mutation behavior and supports logging/retry/history patterns.

## 3. Trio Combinations That Work Well Together

### Trio A (recommended first): Abstract Factory + Facade + Strategy
- Flow: App factory provides correct modules -> Facade exposes use-case methods -> Strategy selects table/feature-specific behavior.
- Best for immediate structure with clear admin/client separation.

### Trio B: Factory Method + Adapter + Command
- Flow: Factory creates command handlers -> Commands use adapters to execute provider operations.
- Best for clean mutation pipelines and easier testing.

### Trio C: Abstract Factory + Adapter + Strategy
- Flow: Factory selects app-specific adapters and strategies -> Strategy drives behavior -> Adapter executes data access.
- Best when the same domain logic needs app-specific policies.

### Trio D: Facade + Strategy + Command
- Flow: UI/API calls Facade -> Facade dispatches command -> Command applies selected strategy.
- Best for long-term maintainability of complex workflows.

## 4. Suggested Rollout Order
1. Introduce `AdminDataFactory` and `ClientDataFactory` with a minimal set of repositories.
2. Add a `DataFacade` for top features (orders, products, users).
3. Convert current `TABLE_CRUD_PRESETS` into typed strategies.
4. Move insert/update/delete into command handlers.
5. Hide Supabase details behind adapters and return app DTOs.

## 5. Minimal Target Architecture
- UI pages: presentation and local interaction state only.
- API routes: request validation and calling facade methods.
- Abstract factories/factory methods: create app-specific module families.
- Facade: stable use-case API surface.
- Strategies: per-feature or per-table behavior rules.
- Commands: mutation execution units.
- Adapters: provider-specific integration boundary.
