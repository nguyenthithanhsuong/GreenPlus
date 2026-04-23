"use client";

import { useEffect, useMemo, useState } from "react";
import { allOperations, tableDefinitions } from "@/lib/supabaseExamples";

type OperationResult = {
  table: string;
  operation: string;
  args: string[];
  data: unknown;
  error: unknown;
};

const DEFAULT_TABLE = tableDefinitions.find((definition) => definition.table === "users")?.table ?? tableDefinitions[0]?.table ?? "users";

function buildDefaultFieldValues(inputFields: Array<{ name: string; example?: string }> | undefined) {
  return Object.fromEntries((inputFields ?? []).map((field) => [field.name, field.example ?? ""]));
}

export default function SupabaseCrudExplorer() {
  const [selectedTable, setSelectedTable] = useState(DEFAULT_TABLE);
  const tableOperations = allOperations[selectedTable] ?? {};
  const operationNames = useMemo(() => Object.keys(tableOperations), [tableOperations]);
  const [selectedOperation, setSelectedOperation] = useState(operationNames[0] ?? "select");
  const currentOperation = tableOperations[selectedOperation] ?? null;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OperationResult | null>(null);

  useEffect(() => {
    const nextOperationName = operationNames.includes(selectedOperation) ? selectedOperation : operationNames[0] ?? "select";
    setSelectedOperation(nextOperationName);
  }, [operationNames, selectedOperation]);

  useEffect(() => {
    const operation = tableOperations[selectedOperation] ?? tableOperations[operationNames[0] ?? ""];
    setFieldValues(buildDefaultFieldValues(operation?.inputFields));
    setError(null);
    setResult(null);
  }, [selectedTable, selectedOperation, tableOperations, operationNames]);

  const inputFields = currentOperation?.inputFields ?? [];

  const executeOperation = async () => {
    if (!currentOperation) {
      setError("No operation selected");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const args = inputFields.map((field) => fieldValues[field.name] ?? "");
      const { data, error: operationError } = await currentOperation.execute(...args);

      setResult({
        table: selectedTable,
        operation: selectedOperation,
        args,
        data,
        error: operationError,
      });
    } catch (executeError) {
      setError(executeError instanceof Error ? executeError.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const tableOptions = tableDefinitions.map((definition) => definition.table);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Supabase CRUD Explorer</h2>
          <p className="mt-2 text-sm text-slate-600">
            Playground fetch logic loaded into web-admin for table select, by-id lookup, insert, update, and delete.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {tableDefinitions.length} tables loaded
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700">
            Table
            <select
              value={selectedTable}
              onChange={(event) => setSelectedTable(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {tableOptions.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Operation
            <select
              value={selectedOperation}
              onChange={(event) => setSelectedOperation(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {operationNames.map((operationName) => (
                <option key={operationName} value={operationName}>
                  {operationName}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              void executeOperation();
            }}
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Running..." : "Execute Operation"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Operation</p>
                <h3 className="text-base font-semibold text-slate-950">{selectedTable}.{selectedOperation}</h3>
              </div>
              {currentOperation && (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                  {inputFields.length} inputs
                </span>
              )}
            </div>

            {currentOperation && <p className="mt-3 text-sm text-slate-600">{currentOperation.description}</p>}

            {inputFields.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {inputFields.map((field) => (
                  <label key={field.name} className="block text-sm font-medium text-slate-700 md:col-span-1">
                    {field.name}
                    {field.type ? <span className="ml-2 text-xs font-normal text-slate-500">({field.type})</span> : null}
                    {field.name.includes("payload_json") ? (
                      <textarea
                        value={fieldValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFieldValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        rows={6}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
                      />
                    ) : (
                      <input
                        value={fieldValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFieldValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        placeholder={field.example ?? field.name}
                      />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">This operation does not require inputs.</p>
            )}
          </div>

          {currentOperation && (
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Generated Query</p>
              <pre className="mt-2 overflow-x-auto text-xs leading-6">
                {currentOperation.query}
              </pre>
            </div>
          )}

          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {result && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Operation result</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {result.table} / {result.operation}
                </span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}