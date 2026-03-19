"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AdminFeature = {
  key: string;
  label: string;
  table: string;
  description: string;
  group: "Admin" | "Manager" | "Employee";
};

const adminFeatures: AdminFeature[] = [
  {
    key: "overview",
    label: "Dashboard tong quan",
    table: "orders",
    description: "Doanh thu, user moi, tinh trang kho",
    group: "Admin",
  },
  {
    key: "accounts",
    label: "Quan ly tai khoan & vai tro",
    table: "users",
    description: "Danh sach user, khoa/mo, phan quyen",
    group: "Admin",
  },
  {
    key: "roles",
    label: "Cau hinh vai tro",
    table: "roles",
    description: "Admin, Manager, Employee",
    group: "Admin",
  },
  {
    key: "supplier-approval",
    label: "Phe duyet nha cung cap",
    table: "suppliers",
    description: "Don dang ky mo gian hang",
    group: "Admin",
  },
  {
    key: "content-moderation",
    label: "Kiem duyet noi dung",
    table: "posts",
    description: "Blog, video cong dong, noi dung danh gia",
    group: "Admin",
  },
  {
    key: "analytics",
    label: "Bao cao & phan tich",
    table: "payments",
    description: "Bao cao tai chinh, chiet khau, hanh vi",
    group: "Admin",
  },
  {
    key: "product-catalog",
    label: "Quan ly san pham & danh muc",
    table: "products",
    description: "Dang ban, vietgap, organic",
    group: "Manager",
  },
  {
    key: "categories",
    label: "Quan ly danh muc",
    table: "categories",
    description: "Danh muc rau cu, trai cay, thit sach",
    group: "Manager",
  },
  {
    key: "batch-qr",
    label: "Quan ly lo hang & QR",
    table: "batches",
    description: "Nhap lo theo ngay thu hoach va truy xuat",
    group: "Manager",
  },
  {
    key: "inventory-price",
    label: "Quan ly kho & bang gia",
    table: "inventory",
    description: "Ton kho thuc te, dieu chinh gia",
    group: "Manager",
  },
  {
    key: "prices",
    label: "Bang gia theo lo",
    table: "prices",
    description: "Gia theo do tuoi va theo lo hang",
    group: "Manager",
  },
  {
    key: "order-assign",
    label: "Dieu phoi don hang",
    table: "deliveries",
    description: "Phan bo don cho shipper",
    group: "Manager",
  },
  {
    key: "complaints",
    label: "Quan ly khieu nai",
    table: "complaints",
    description: "Doi tra va phan hoi xau",
    group: "Manager",
  },
  {
    key: "shipper-orders",
    label: "Don hang duoc giao",
    table: "deliveries",
    description: "Lo trinh, khach hang, ghi chu di cho ho",
    group: "Employee",
  },
  {
    key: "qr-check",
    label: "Xac nhan lo hang (QR)",
    table: "batches",
    description: "Kiem tra dung lo truoc khi giao",
    group: "Employee",
  },
];

const groupOrder: Array<AdminFeature["group"]> = ["Admin", "Manager", "Employee"];

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<AdminFeature>(adminFeatures[0]);
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

  const groupedFeatures = useMemo(() => {
    return groupOrder.map((groupName) => ({
      group: groupName,
      items: adminFeatures.filter((f) => f.group === groupName),
    }));
  }, []);

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
          <h1 className="text-2xl font-bold">GreenPlus Admin & Management Showcase</h1>
          <p className="mt-1 text-sm text-slate-300">
            Sidebar ben trai mo phong workflow cho Admin, Manager va Employee. Bam muc nao se hien du lieu select all cua bang Supabase tuong ung.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-3 lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Admin Sidebar
            </h2>
            <div className="space-y-4">
              {groupedFeatures.map((groupBlock) => (
                <div key={groupBlock.group}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {groupBlock.group}
                  </h3>
                  <div className="space-y-2">
                    {groupBlock.items.map((feature) => (
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
                </div>
              ))}
            </div>
          </aside>

          <main className="space-y-4 lg:col-span-3">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-lg font-semibold text-emerald-300">{activeFeature.label}</h2>
              <p className="mt-1 text-sm text-slate-300">{activeFeature.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Role group: <span className="font-semibold text-slate-200">{activeFeature.group}</span> | Supabase table:{" "}
                <span className="font-semibold text-slate-200">{activeFeature.table}</span>
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
