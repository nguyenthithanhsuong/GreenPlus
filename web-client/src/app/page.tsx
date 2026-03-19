"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FeatureItem = {
  key: string;
  label: string;
  table: string;
  description: string;
};

const clientFeatures: FeatureItem[] = [
  {
    key: "home",
    label: "Trang chu",
    table: "products",
    description: "Banner, danh muc noi bat, san pham mua chung",
  },
  {
    key: "shop",
    label: "Danh sach san pham",
    table: "products",
    description: "Loc theo chung nhan, do tuoi, gia",
  },
  {
    key: "product-detail",
    label: "Chi tiet san pham",
    table: "batches",
    description: "Thong tin dinh duong, lo hang, truy xuat QR",
  },
  {
    key: "blog",
    label: "Blog dinh duong",
    table: "posts",
    description: "Bai viet huong dan nau an, kien thuc thuc pham sach",
  },
  {
    key: "cart",
    label: "Gio hang & ghi chu",
    table: "cart_items",
    description: "Nhap ghi chu dac thu khi di cho ho",
  },
  {
    key: "group-buy",
    label: "Mua chung",
    table: "group_buys",
    description: "Danh sach nhom dang gom don",
  },
  {
    key: "subscription",
    label: "Mua dinh ky",
    table: "subscriptions",
    description: "Quan ly lich giao hang tu dong",
  },
  {
    key: "community",
    label: "Cong dong GreenPlus",
    table: "posts",
    description: "Chia se hinh anh/video trai nghiem",
  },
  {
    key: "profile",
    label: "Trang ca nhan",
    table: "users",
    description: "Thong tin thanh vien, diem thuong",
  },
  {
    key: "tracking",
    label: "Theo doi don hang",
    table: "order_tracking",
    description: "Trang thai don theo thoi gian thuc",
  },
  {
    key: "history",
    label: "Lich su mua hang",
    table: "orders",
    description: "Xem lai don cu va mua lai nhanh",
  },
  {
    key: "reviews",
    label: "Danh gia san pham",
    table: "reviews",
    description: "Danh gia va nhan xet cua nguoi dung",
  },
];

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<FeatureItem>(clientFeatures[0]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from(activeFeature.table)
        .select("*")
        .limit(30);

      if (queryError) {
        setRows([]);
        setError(queryError.message);
      } else {
        setRows((data ?? []) as Record<string, unknown>[]);
      }

      setLoading(false);
    };

    void loadRows();
  }, [activeFeature]);

  const columns = useMemo(() => {
    if (rows.length === 0) return [] as string[];
    return Object.keys(rows[0]);
  }, [rows]);

  const crudTemplates = useMemo(() => {
    const table = activeFeature.table;
    return {
      select: `supabase.from("${table}").select("*").limit(30)`,
      insert: `supabase.from("${table}").insert([{ /* data */ }]).select()`,
      update: `supabase.from("${table}").update({ /* data */ }).eq("id", "...").select()`,
      del: `supabase.from("${table}").delete().eq("id", "...")`,
    };
  }, [activeFeature.table]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-2xl font-bold">GreenPlus Client Web Showcase</h1>
          <p className="mt-1 text-sm text-slate-300">
            Click a feature on the left to view data from its mapped Supabase table.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-3 lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Client Features
            </h2>
            <div className="space-y-2">
              {clientFeatures.map((feature) => (
                <button
                  key={feature.key}
                  onClick={() => setActiveFeature(feature)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    activeFeature.key === feature.key
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="space-y-4 lg:col-span-3">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-lg font-semibold text-emerald-300">{activeFeature.label}</h2>
              <p className="mt-1 text-sm text-slate-300">{activeFeature.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Supabase table: <span className="font-semibold text-slate-200">{activeFeature.table}</span>
              </p>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">CRUD Commands</h3>
              <div className="space-y-2 text-xs text-slate-200">
                <pre className="overflow-x-auto rounded bg-slate-800 p-2">SELECT: {crudTemplates.select}</pre>
                <pre className="overflow-x-auto rounded bg-slate-800 p-2">INSERT: {crudTemplates.insert}</pre>
                <pre className="overflow-x-auto rounded bg-slate-800 p-2">UPDATE: {crudTemplates.update}</pre>
                <pre className="overflow-x-auto rounded bg-slate-800 p-2">DELETE: {crudTemplates.del}</pre>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Select * Result</h3>
                {loading && <span className="text-xs text-amber-300">Loading...</span>}
              </div>

              {error && (
                <div className="mb-3 rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {!loading && !error && rows.length === 0 && (
                <div className="rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300">
                  No rows found in this table.
                </div>
              )}

              {!error && rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column} className="border-b border-slate-700 px-2 py-2 font-semibold text-slate-300">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-slate-800/80">
                          {columns.map((column) => (
                            <td key={column} className="max-w-xs px-2 py-2 align-top text-slate-200">
                              <div className="line-clamp-3 break-all">
                                {typeof row[column] === "object"
                                  ? JSON.stringify(row[column])
                                  : String(row[column] ?? "")}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
