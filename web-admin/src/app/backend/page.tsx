"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SupabaseCrudExplorer from "../../../frontend/backend/SupabaseCrudExplorer";

type EndpointCheck = {
  id: string;
  label: string;
  path: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  expectedStatuses: number[];
};

type CheckResult = {
  id: string;
  ok: boolean;
  status: number;
  durationMs: number;
  summary: string;
  data: unknown;
};

type RealtimeEvent = {
  id: string;
  table: "orders" | "inventory";
  eventType: string;
  timestamp: string;
  payload: unknown;
};

const endpointChecks: EndpointCheck[] = [
  {
    id: "auth-get",
    label: "Auth Route",
    path: "/api/auth",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    id: "orders-get",
    label: "Orders Route",
    path: "/api/orders",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    id: "deliveries-get",
    label: "Deliveries Route",
    path: "/api/deliveries",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    id: "products-get",
    label: "Products Route",
    path: "/api/products",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    id: "payment-process-valid",
    label: "Payment Process (Valid Payload)",
    path: "/api/payments/process",
    method: "POST",
    body: {
      orderId: "ORDER_12345",
      amount: 150000,
      method: "vnpay",
    },
    expectedStatuses: [200],
  },
  {
    id: "payment-process-invalid",
    label: "Payment Process (Invalid Payload)",
    path: "/api/payments/process",
    method: "POST",
    body: {
      orderId: "ORDER_12345",
      amount: -1,
      method: "vnpay",
    },
    expectedStatuses: [400],
  },
];

function statusClass(ok: boolean): string {
  return ok
    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
    : "border-rose-300 bg-rose-50 text-rose-900";
}

export default function BackendHealthPage() {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [running, setRunning] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const appendEvent = (table: RealtimeEvent["table"], payload: unknown, eventType: string) => {
      setRealtimeEvents((prev) =>
        [
          {
            id: `${Date.now()}-${table}`,
            table,
            eventType,
            timestamp: new Date().toISOString(),
            payload,
          },
          ...prev,
        ].slice(0, 30)
      );
    };

    const channel = supabase
      .channel("admin-runtime-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          appendEvent("orders", payload, payload.eventType);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        (payload) => {
          appendEvent("inventory", payload, payload.eventType);
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    const list = Object.values(results);
    const pass = list.filter((item) => item.ok).length;
    const fail = list.filter((item) => !item.ok).length;
    return { pass, fail, total: endpointChecks.length };
  }, [results]);

  const runCheck = async (check: EndpointCheck): Promise<CheckResult> => {
    const startedAt = performance.now();
    const options: RequestInit = {
      method: check.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (check.method === "POST" && check.body) {
      options.body = JSON.stringify(check.body);
    }

    try {
      const response = await fetch(check.path, options);
      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = { message: "No JSON response body" };
      }

      const ok = check.expectedStatuses.includes(response.status);
      const durationMs = Math.round(performance.now() - startedAt);

      return {
        id: check.id,
        ok,
        status: response.status,
        durationMs,
        summary: ok
          ? `Expected status received: ${response.status}`
          : `Unexpected status: ${response.status}`,
        data,
      };
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);
      const message = error instanceof Error ? error.message : "Unknown error";

      return {
        id: check.id,
        ok: false,
        status: 0,
        durationMs,
        summary: `Request failed: ${message}`,
        data: { error: message },
      };
    }
  };

  const runAllChecks = async (): Promise<void> => {
    setRunning(true);
    const nextResults: Record<string, CheckResult> = {};

    for (const check of endpointChecks) {
      const result = await runCheck(check);
      nextResults[check.id] = result;
      setResults((prev) => ({ ...prev, [check.id]: result }));
    }

    setResults(nextResults);
    setRunning(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold">Backend Runtime Check</h1>
          <p className="mt-2 text-sm text-slate-600">
            Test all API routes and show success/failure with response details.
          </p>
          <div className="mt-2">
            <Link href="/backend/storage" className="text-sm font-medium text-blue-700 hover:underline">
              Open Storage Upload Test
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                void runAllChecks();
              }}
              disabled={running}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? "Running checks..." : "Run All Checks"}
            </button>
            <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Success: {totals.pass}
            </span>
            <span className="rounded-md bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
              Failed: {totals.fail}
            </span>
            <span className="rounded-md bg-slate-200 px-3 py-1 text-xs font-medium text-slate-800">
              Total: {totals.total}
            </span>
          </div>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Realtime Monitor</h2>
            <span className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800">
              status: {realtimeStatus}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Subscribed tables: orders, inventory.
          </p>

          {realtimeEvents.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No realtime events yet.</p>
          )}

          {realtimeEvents.length > 0 && (
            <div className="mt-4 space-y-3">
              {realtimeEvents.map((evt) => (
                <article key={evt.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {evt.table} | {evt.eventType} | {evt.timestamp}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2 text-xs text-slate-100">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {endpointChecks.map((check) => {
            const result = results[check.id];
            return (
              <article
                key={check.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">{check.label}</h2>
                    <p className="text-sm text-slate-600">
                      {check.method} {check.path}
                    </p>
                  </div>
                  {!result && (
                    <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      Not run yet
                    </span>
                  )}
                  {result && (
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${statusClass(
                        result.ok
                      )}`}
                    >
                      {result.ok ? "PASS" : "FAIL"}
                    </span>
                  )}
                </div>

                {result && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span> {result.status} |{" "}
                      <span className="font-medium">Time:</span> {result.durationMs}ms
                    </p>
                    <p className="text-sm">{result.summary}</p>
                    <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <div className="mt-6">
          <SupabaseCrudExplorer />
        </div>
      </div>
    </main>
  );
}
