import { ADMIN_CORE_TABLES, APP_USE_CASES, ROLE_POLICIES } from "@greenplus/supabase-shared/accessPolicy";

export default function AdminFrontendPage() {
  const useCases = APP_USE_CASES["web-admin"];
  const adminPolicy = ROLE_POLICIES.find((policy) => policy.role === "admin");
  const managerPolicy = ROLE_POLICIES.find((policy) => policy.role === "manager");
  const employeePolicy = ROLE_POLICIES.find((policy) => policy.role === "employee");

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Web Admin Configuration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access model is derived from Supabase playground RLS guidance: admin has platform-wide control,
            manager handles operations, and employee handles assigned deliveries.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Admin Use Cases</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <article key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tables</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tables.map((table) => (
                    <span key={table} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">
                      {table}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Role Access Snapshot</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            {adminPolicy && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                <p className="font-semibold">Admin</p>
                <p>{adminPolicy.description}</p>
                <p className="mt-1 text-xs">Permissions: SELECT/INSERT/UPDATE/DELETE on all tables.</p>
              </div>
            )}
            {managerPolicy && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="font-semibold">Manager</p>
                <p>{managerPolicy.description}</p>
                <p className="mt-1 text-xs">Scope: orders, fulfillment, catalog operations, inventory control.</p>
              </div>
            )}
            {employeePolicy && (
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-3">
                <p className="font-semibold">Employee</p>
                <p>{employeePolicy.description}</p>
                <p className="mt-1 text-xs">Scope: assigned deliveries and delivery-related status updates.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Admin Core Tables</h2>
          <p className="mt-1 text-sm text-slate-600">
            The admin app can read the whole platform model; mutation authority should be narrowed by role and RLS.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ADMIN_CORE_TABLES.map((table) => (
              <span key={table} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">
                {table}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
