import { APP_USE_CASES, CLIENT_VISIBLE_TABLES, ROLE_POLICIES } from "@greenplus/supabase-shared/accessPolicy";

export default function ClientFrontendPage() {
  const useCases = APP_USE_CASES["web-client"];
  const customerPolicy = ROLE_POLICIES.find((policy) => policy.role === "customer");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Web Client Configuration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Client access follows Supabase playground RLS guidance: customers can browse active catalog data and
            manage only their own profile, cart, orders, and reviews.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Client Use Cases</h2>
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
          <h2 className="text-lg font-semibold">Customer Access Summary</h2>
          {customerPolicy && (
            <div className="mt-3 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">Role: customer</p>
              <p>{customerPolicy.description}</p>
              <p className="mt-1 text-xs">
                Mutations should be limited to ownership rows by RLS (own profile/cart/orders/reviews/subscriptions).
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Client Visible Tables</h2>
          <p className="mt-1 text-sm text-slate-600">
            These are the tables intended to be queryable in client journeys, with ownership constraints for private data.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLIENT_VISIBLE_TABLES.map((table) => (
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
