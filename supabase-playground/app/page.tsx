"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRelationshipsForTable } from "@/lib/databaseRelationships";
import { TABLE_CRUD_PRESETS } from "@/lib/crudPresets";

type ClientFeature = {
  key: string;
  label: string;
  table: string;
  description: string;
};

type AdminFeature = {
  key: string;
  label: string;
  table: string;
  description: string;
  group: "Admin" | "Manager" | "Employee";
};

type SelectedRelationship = {
  tableName: string;
  foreignKey: string;
  direction: "outgoing" | "incoming";
};

function parseForeignKeyFields(foreignKey: string): { sourceField: string | null; targetField: string | null } {
  const [sourcePart, targetPart] = foreignKey.split("→").map((part) => part?.trim());
  const sourceField = sourcePart?.split(".")[1] ?? null;
  const targetField = targetPart?.split(".")[1] ?? null;
  return { sourceField, targetField };
}

const clientFeatures: ClientFeature[] = [
  { key: "home", label: "Trang chu", table: "products", description: "Banner, danh muc noi bat, san pham mua chung" },
  { key: "shop", label: "Danh sach san pham", table: "products", description: "Loc theo chung nhan, do tuoi, gia" },
  { key: "product-detail", label: "Chi tiet san pham", table: "batches", description: "Thong tin dinh duong, lo hang, truy xuat QR" },
  { key: "blog", label: "Blog dinh duong", table: "posts", description: "Bai viet huong dan nau an, kien thuc thuc pham sach" },
  { key: "cart", label: "Gio hang & ghi chu", table: "cart_items", description: "Nhap ghi chu dac thu khi di cho ho" },
  { key: "group-buy", label: "Mua chung", table: "group_buys", description: "Danh sach nhom dang gom don" },
  { key: "subscription", label: "Mua dinh ky", table: "subscriptions", description: "Quan ly lich giao hang tu dong" },
  { key: "community", label: "Cong dong GreenPlus", table: "posts", description: "Chia se hinh anh/video trai nghiem" },
  { key: "profile", label: "Trang ca nhan", table: "users", description: "Thong tin thanh vien, diem thuong" },
  { key: "tracking", label: "Theo doi don hang", table: "order_tracking", description: "Trang thai don theo thoi gian thuc" },
  { key: "history", label: "Lich su mua hang", table: "orders", description: "Xem lai don cu va mua lai nhanh" },
  { key: "reviews", label: "Danh gia san pham", table: "reviews", description: "Danh gia va nhan xet cua nguoi dung" },
];

const adminFeatures: AdminFeature[] = [
  { key: "overview", label: "Dashboard tong quan", table: "orders", description: "Doanh thu, user moi, tinh trang kho", group: "Admin" },
  { key: "accounts", label: "Quan ly tai khoan & vai tro", table: "users", description: "Danh sach user, khoa/mo, phan quyen", group: "Admin" },
  { key: "roles", label: "Cau hinh vai tro", table: "roles", description: "Admin, Manager, Employee", group: "Admin" },
  { key: "supplier-approval", label: "Phe duyet nha cung cap", table: "suppliers", description: "Don dang ky mo gian hang", group: "Admin" },
  { key: "content-moderation", label: "Kiem duyet noi dung", table: "posts", description: "Blog, video cong dong, noi dung danh gia", group: "Admin" },
  { key: "analytics", label: "Bao cao & phan tich", table: "payments", description: "Bao cao tai chinh, chiet khau, hanh vi", group: "Admin" },
  { key: "product-catalog", label: "Quan ly san pham & danh muc", table: "products", description: "Dang ban, vietgap, organic", group: "Manager" },
  { key: "categories", label: "Quan ly danh muc", table: "categories", description: "Danh muc rau cu, trai cay, thit sach", group: "Manager" },
  { key: "batch-qr", label: "Quan ly lo hang & QR", table: "batches", description: "Nhap lo theo ngay thu hoach va truy xuat", group: "Manager" },
  { key: "inventory-price", label: "Quan ly kho & bang gia", table: "inventory", description: "Ton kho thuc te, dieu chinh gia", group: "Manager" },
  { key: "prices", label: "Bang gia theo lo", table: "prices", description: "Gia theo do tuoi va theo lo hang", group: "Manager" },
  { key: "order-assign", label: "Dieu phoi don hang", table: "deliveries", description: "Phan bo don cho shipper", group: "Manager" },
  { key: "complaints", label: "Quan ly khieu nai", table: "complaints", description: "Doi tra va phan hoi xau", group: "Manager" },
  { key: "shipper-orders", label: "Don hang duoc giao", table: "deliveries", description: "Lo trinh, khach hang, ghi chu di cho ho", group: "Employee" },
  { key: "qr-check", label: "Xac nhan lo hang (QR)", table: "batches", description: "Kiem tra dung lo truoc khi giao", group: "Employee" },
];

const groupOrder: Array<AdminFeature["group"]> = ["Admin", "Manager", "Employee"];

export default function SupabasePlayground() {
  const [mode, setMode] = useState<"client" | "admin" | "combined">("client");
  const [activeClientFeature, setActiveClientFeature] = useState<ClientFeature>(clientFeatures[0]);
  const [activeAdminFeature, setActiveAdminFeature] = useState<AdminFeature>(adminFeatures[0]);
  const [combinedFocus, setCombinedFocus] = useState<"client" | "admin">("client");
  const [expandedRelationships, setExpandedRelationships] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<SelectedRelationship | null>(null);
  const [relatedRows, setRelatedRows] = useState<Record<string, unknown>[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [selectedRelatedId, setSelectedRelatedId] = useState<string | null>(null);
  const [insertPayload, setInsertPayload] = useState('{\n  \n}');
  const [updateId, setUpdateId] = useState("");
  const [updatePayload, setUpdatePayload] = useState('{\n  \n}');
  const [deleteId, setDeleteId] = useState("");
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationResult, setMutationResult] = useState<Record<string, unknown>[] | null>(null);

  const activeFeature = useMemo(() => {
    if (mode === "client") return activeClientFeature;
    if (mode === "admin") return activeAdminFeature;
    return combinedFocus === "client" ? activeClientFeature : activeAdminFeature;
  }, [mode, combinedFocus, activeClientFeature, activeAdminFeature]);

  useEffect(() => {
    setSelectedRelationship(null);
    setSelectedRelatedId(null);
    setMutationError(null);
    setMutationResult(null);
  }, [mode, activeFeature.table]);

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
  }, [activeFeature.table, refreshTick]);

  useEffect(() => {
    const loadRelatedRows = async () => {
      if (!selectedRelationship) {
        setRelatedRows([]);
        return;
      }

      const { sourceField } = parseForeignKeyFields(selectedRelationship.foreignKey);

      if (selectedRelationship.direction === "incoming") {
        if (!selectedRelatedId || !sourceField) {
          setRelatedRows([]);
          return;
        }

        setRelatedLoading(true);
        const { data, error: queryError } = await supabase
          .from(selectedRelationship.tableName)
          .select("*")
          .eq(sourceField, selectedRelatedId)
          .limit(50);

        if (!queryError && data) {
          setRelatedRows((data ?? []) as Record<string, unknown>[]);
        } else {
          setRelatedRows([]);
        }
        setRelatedLoading(false);
        return;
      }

      setRelatedLoading(true);
      const { data, error: queryError } = await supabase
        .from(selectedRelationship.tableName)
        .select("*")
        .limit(50);

      if (!queryError && data) {
        setRelatedRows((data ?? []) as Record<string, unknown>[]);
      } else {
        setRelatedRows([]);
      }
      setRelatedLoading(false);
    };

    void loadRelatedRows();
  }, [selectedRelationship, selectedRelatedId]);

  const filteredRows = useMemo(() => {
    if (!selectedRelatedId || !selectedRelationship || selectedRelationship.direction !== "outgoing") return rows;
    const { sourceField } = parseForeignKeyFields(selectedRelationship.foreignKey);
    if (!sourceField) return rows;
    return rows.filter((row) => String(row[sourceField] || "") === selectedRelatedId);
  }, [rows, selectedRelatedId, selectedRelationship]);

  const displayRows = useMemo(() => {
    if (selectedRelationship?.direction === "incoming" && selectedRelatedId) {
      return relatedRows;
    }
    return filteredRows;
  }, [filteredRows, relatedRows, selectedRelationship, selectedRelatedId]);

  const columns = useMemo(() => {
    if (displayRows.length === 0) return [] as string[];
    return Object.keys(displayRows[0]);
  }, [displayRows]);

  const tablePreset = TABLE_CRUD_PRESETS[activeFeature.table];

  const primaryKeyColumn = useMemo(() => {
    if (tablePreset?.primaryKey) return tablePreset.primaryKey;
    if (rows.length === 0) return "id";
    const keys = Object.keys(rows[0]);
    if (keys.includes("id")) return "id";
    return keys.find((k) => k.endsWith("_id")) ?? "id";
  }, [rows, tablePreset]);

  useEffect(() => {
    if (tablePreset) {
      setInsertPayload(JSON.stringify(tablePreset.insert, null, 2));
      setUpdatePayload(JSON.stringify(tablePreset.update, null, 2));
      setUpdateId(tablePreset.idExample);
      setDeleteId(tablePreset.idExample);
    } else {
      setInsertPayload('{\n  \n}');
      setUpdatePayload('{\n  \n}');
      setUpdateId("");
      setDeleteId("");
    }
    setMutationError(null);
    setMutationResult(null);
  }, [activeFeature.table, tablePreset]);

  const parseJsonPayload = (raw: string) => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("Payload must be valid JSON");
    }
  };

  const cleanInsertPayload = (payload: Record<string, unknown>) => {
    return Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") {
          const normalized = value.trim().toLowerCase();
          if (!normalized) return false;
          if (normalized === "__auto__" || normalized === "auto" || normalized === "default") return false;
        }
        return true;
      })
    );
  };

  const coercePrimaryKeyValue = (raw: string) => {
    const sample = rows[0]?.[primaryKeyColumn];
    if (typeof sample === "number") {
      const numeric = Number(raw);
      if (Number.isNaN(numeric)) {
        throw new Error(`Primary key ${primaryKeyColumn} expects a number`);
      }
      return numeric;
    }
    return raw;
  };

  const runInsert = async () => {
    setMutationLoading(true);
    setMutationError(null);
    setMutationResult(null);
    try {
      const parsedPayload = parseJsonPayload(insertPayload);
      const payload = cleanInsertPayload(parsedPayload);
      if (Object.keys(payload).length === 0) {
        throw new Error("Insert payload is empty after removing blank/auto fields");
      }
      const { data, error: queryError } = await supabase
        .from(activeFeature.table)
        .insert([payload])
        .select();
      if (queryError) throw new Error(queryError.message);
      setMutationResult((data ?? []) as Record<string, unknown>[]);
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Insert failed");
    } finally {
      setMutationLoading(false);
    }
  };

  const runUpdate = async () => {
    setMutationLoading(true);
    setMutationError(null);
    setMutationResult(null);
    try {
      if (!updateId.trim()) throw new Error(`Enter ${primaryKeyColumn} to update`);
      const payload = parseJsonPayload(updatePayload);
      const idValue = coercePrimaryKeyValue(updateId.trim());
      const { data, error: queryError } = await supabase
        .from(activeFeature.table)
        .update(payload)
        .eq(primaryKeyColumn, idValue)
        .select();
      if (queryError) throw new Error(queryError.message);
      setMutationResult((data ?? []) as Record<string, unknown>[]);
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setMutationLoading(false);
    }
  };

  const runDelete = async () => {
    setMutationLoading(true);
    setMutationError(null);
    setMutationResult(null);
    try {
      if (!deleteId.trim()) throw new Error(`Enter ${primaryKeyColumn} to delete`);
      const idValue = coercePrimaryKeyValue(deleteId.trim());
      const { data, error: queryError } = await supabase
        .from(activeFeature.table)
        .delete()
        .eq(primaryKeyColumn, idValue)
        .select();
      if (queryError) throw new Error(queryError.message);
      setMutationResult((data ?? []) as Record<string, unknown>[]);
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setMutationLoading(false);
    }
  };

  const crudTemplates = useMemo(() => {
    const table = activeFeature.table;
    const presetInsert = JSON.stringify(tablePreset?.insert ?? { field: "" });
    const presetUpdate = JSON.stringify(tablePreset?.update ?? { field: "" });
    const presetId = tablePreset?.idExample ?? "";

    return {
      select: `supabase.from("${table}").select("*").limit(30)`,
      insert: `supabase.from("${table}").insert([${presetInsert}]).select()`,
      update: `supabase.from("${table}").update(${presetUpdate}).eq("${primaryKeyColumn}", "${presetId}").select()`,
      del: `supabase.from("${table}").delete().eq("${primaryKeyColumn}", "${presetId}")`,
    };
  }, [activeFeature.table, primaryKeyColumn, tablePreset]);

  const tableRelationships = getRelationshipsForTable(activeFeature.table);

  const groupedAdminFeatures = useMemo(() => {
    return groupOrder.map((groupName) => ({
      group: groupName,
      items: adminFeatures.filter((f) => f.group === groupName),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-2xl font-bold">GreenPlus Supabase Playground</h1>
          <p className="mt-1 text-sm text-slate-300">Combined Admin + Client showcase with relationships and live CRUD execution.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-3 lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">Mode</h2>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode("client")}
                className={`rounded px-2 py-2 text-xs font-semibold transition ${
                  mode === "client" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Client
              </button>
              <button
                onClick={() => setMode("admin")}
                className={`rounded px-2 py-2 text-xs font-semibold transition ${
                  mode === "admin" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setMode("combined")}
                className={`rounded px-2 py-2 text-xs font-semibold transition ${
                  mode === "combined" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Combined
              </button>
            </div>

            {mode === "client" ? (
              <div className="space-y-2">
                {clientFeatures.map((feature) => (
                  <button
                    key={feature.key}
                    onClick={() => {
                      setActiveClientFeature(feature);
                      setCombinedFocus("client");
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                      activeClientFeature.key === feature.key
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            ) : mode === "admin" ? (
              <div className="space-y-4">
                {groupedAdminFeatures.map((groupBlock) => (
                  <div key={groupBlock.group}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{groupBlock.group}</h3>
                    <div className="space-y-2">
                      {groupBlock.items.map((feature) => (
                        <button
                          key={feature.key}
                          onClick={() => {
                            setActiveAdminFeature(feature);
                            setCombinedFocus("admin");
                          }}
                          className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                            activeAdminFeature.key === feature.key
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
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">Client Features</h3>
                  <div className="space-y-2">
                    {clientFeatures.map((feature) => (
                      <button
                        key={feature.key}
                        onClick={() => {
                          setActiveClientFeature(feature);
                          setCombinedFocus("client");
                        }}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                          combinedFocus === "client" && activeClientFeature.key === feature.key
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                            : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                        }`}
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Admin Features</h3>
                  <div className="space-y-3">
                    {groupedAdminFeatures.map((groupBlock) => (
                      <div key={groupBlock.group}>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{groupBlock.group}</p>
                        <div className="space-y-1.5">
                          {groupBlock.items.map((feature) => (
                            <button
                              key={feature.key}
                              onClick={() => {
                                setActiveAdminFeature(feature);
                                setCombinedFocus("admin");
                              }}
                              className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                                combinedFocus === "admin" && activeAdminFeature.key === feature.key
                                  ? "border-amber-500 bg-amber-500/10 text-amber-200"
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
                </div>
              </div>
            )}
          </aside>

          <aside className={`rounded-xl border transition-all duration-300 lg:col-span-1 ${expandedRelationships || tableRelationships ? "border-blue-600 bg-slate-900/80 p-3" : "border-slate-800 bg-slate-900/50 p-3"}`}>
            <div className="space-y-3">
              <button
                onClick={() => setExpandedRelationships(!expandedRelationships)}
                className="w-full rounded-md border border-blue-500 bg-blue-500/10 px-3 py-2 text-left text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                Relationships
              </button>

              {(expandedRelationships || tableRelationships) && tableRelationships && (
                <div className="space-y-3 text-xs">
                  <div className="rounded-md border border-slate-700 bg-slate-800/50 p-2">
                    <p className="font-semibold text-cyan-300">{tableRelationships.category}</p>
                    <p className="mt-1 text-slate-300">{tableRelationships.table}</p>
                  </div>

                  {tableRelationships.outgoing.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-300">Referenced Tables</p>
                      {tableRelationships.outgoing.map((rel, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedRelationship({ tableName: rel.targetTable, foreignKey: rel.foreignKey, direction: "outgoing" });
                            setSelectedRelatedId(null);
                          }}
                          className={`w-full rounded border p-2 text-left transition text-xs ${
                            selectedRelationship?.tableName === rel.targetTable
                              ? "border-amber-500 bg-amber-900/40"
                              : "border-amber-700/50 bg-amber-900/20 hover:bg-amber-900/40"
                          }`}
                        >
                          <p className="font-semibold text-amber-200">{rel.targetTable}</p>
                          <p className="mt-0.5 text-slate-300">{rel.foreignKey}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {tableRelationships.incoming.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-300">Referenced By</p>
                      {tableRelationships.incoming.map((rel, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedRelationship({ tableName: rel.targetTable, foreignKey: rel.foreignKey, direction: "incoming" });
                            setSelectedRelatedId(null);
                          }}
                          className={`w-full rounded border p-2 text-left transition text-xs ${
                            selectedRelationship?.tableName === rel.targetTable
                              ? "border-emerald-500 bg-emerald-900/40"
                              : "border-emerald-700/50 bg-emerald-900/20 hover:bg-emerald-900/40"
                          }`}
                        >
                          <p className="font-semibold text-emerald-200">{rel.targetTable}</p>
                          <p className="mt-0.5 text-slate-300">{rel.foreignKey}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          <main className="space-y-4 lg:col-span-3">
            {selectedRelationship && (
              <section className="rounded-xl border border-blue-800 bg-blue-900/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-blue-300">
                    {selectedRelationship.direction === "incoming"
                      ? `Referenced By: Select ${activeFeature.table} row to load ${selectedRelationship.tableName}`
                      : `Cross-Reference: Select from ${selectedRelationship.tableName}`}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedRelationship(null);
                      setSelectedRelatedId(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>

                {relatedLoading && <p className="text-xs text-slate-400">Loading related records...</p>}
                {!relatedLoading && selectedRelationship.direction === "outgoing" && relatedRows.length === 0 && <p className="text-xs text-slate-400">No records found</p>}
                {!relatedLoading && selectedRelationship.direction === "incoming" && rows.length === 0 && <p className="text-xs text-slate-400">No rows in current table to select</p>}

                {!relatedLoading && selectedRelationship.direction === "outgoing" && relatedRows.length > 0 && (
                  <div className="grid gap-2">
                    {relatedRows.map((record, idx) => {
                      const { targetField } = parseForeignKeyFields(selectedRelationship.foreignKey);
                      const recordId = String(record[targetField ?? ""] || record.id || Object.values(record)[0] || idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedRelatedId(recordId)}
                          className={`rounded border p-2 text-left text-xs transition ${
                            selectedRelatedId === recordId ? "border-blue-500 bg-blue-900/40" : "border-slate-700 bg-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <p className="font-semibold text-slate-200">
                            {Object.entries(record)
                              .slice(0, 2)
                              .map(([key, val]) => `${key}: ${String(val).substring(0, 20)}`)
                              .join(" | ")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!relatedLoading && selectedRelationship.direction === "incoming" && rows.length > 0 && (
                  <div className="grid gap-2">
                    {rows.map((record, idx) => {
                      const { targetField } = parseForeignKeyFields(selectedRelationship.foreignKey);
                      const recordId = String(record[targetField ?? ""] || record.id || Object.values(record)[0] || idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedRelatedId(recordId)}
                          className={`rounded border p-2 text-left text-xs transition ${
                            selectedRelatedId === recordId ? "border-blue-500 bg-blue-900/40" : "border-slate-700 bg-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <p className="font-semibold text-slate-200">
                            {Object.entries(record)
                              .slice(0, 2)
                              .map(([key, val]) => `${key}: ${String(val).substring(0, 20)}`)
                              .join(" | ")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-xl border border-emerald-800/50 bg-gradient-to-br from-slate-900 to-slate-800/50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-3xl font-bold text-emerald-300">{activeFeature.label}</h2>
                {"group" in activeFeature && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500">{(activeFeature as AdminFeature).group}</span>
                )}
                <span className="rounded-full bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-300">{mode.toUpperCase()}</span>
              </div>
              <p className="text-sm italic text-slate-400">{activeFeature.description}</p>
              {selectedRelatedId && (
                <div className="mt-3 rounded-md border border-blue-700/50 bg-blue-900/30 px-3 py-2 text-xs text-blue-300">
                  Filtered by cross-reference: <span className="font-semibold">{selectedRelatedId}</span>
                </div>
              )}
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
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">Run Insert / Update / Delete</h3>
              <p className="mb-3 text-xs text-slate-400">Primary key in this table: <span className="font-semibold text-slate-200">{primaryKeyColumn}</span></p>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded border border-slate-700 bg-slate-800/60 p-3">
                  <p className="mb-2 text-xs font-semibold text-emerald-300">INSERT</p>
                  <p className="mb-2 text-[11px] text-slate-400">Leave blank or use "__auto__" to skip autogenerated/default fields.</p>
                  <textarea value={insertPayload} onChange={(e) => setInsertPayload(e.target.value)} className="h-28 w-full rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-200" />
                  <button onClick={() => void runInsert()} disabled={mutationLoading} className="mt-2 w-full rounded border border-emerald-600 bg-emerald-700/30 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-700/50 disabled:opacity-50">Insert</button>
                </div>

                <div className="rounded border border-slate-700 bg-slate-800/60 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-300">UPDATE</p>
                  <input value={updateId} onChange={(e) => setUpdateId(e.target.value)} placeholder={`Enter ${primaryKeyColumn}`} className="mb-2 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200" />
                  <textarea value={updatePayload} onChange={(e) => setUpdatePayload(e.target.value)} className="h-24 w-full rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-200" />
                  <button onClick={() => void runUpdate()} disabled={mutationLoading} className="mt-2 w-full rounded border border-amber-600 bg-amber-700/30 px-2 py-1 text-xs text-amber-200 hover:bg-amber-700/50 disabled:opacity-50">Update</button>
                </div>

                <div className="rounded border border-slate-700 bg-slate-800/60 p-3">
                  <p className="mb-2 text-xs font-semibold text-red-300">DELETE</p>
                  <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder={`Enter ${primaryKeyColumn}`} className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200" />
                  <button onClick={() => void runDelete()} disabled={mutationLoading} className="mt-2 w-full rounded border border-red-600 bg-red-700/30 px-2 py-1 text-xs text-red-200 hover:bg-red-700/50 disabled:opacity-50">Delete</button>
                </div>
              </div>

              {mutationError && <div className="mt-3 rounded border border-red-700 bg-red-900/30 p-2 text-xs text-red-200">{mutationError}</div>}

              {mutationResult && (
                <div className="mt-3 rounded border border-emerald-700 bg-emerald-900/20 p-2 text-xs text-emerald-200">
                  <p className="mb-1 font-semibold">Mutation Result</p>
                  <pre className="max-h-40 overflow-auto text-xs">{JSON.stringify(mutationResult, null, 2)}</pre>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Select * Result</h3>
                {loading && <span className="text-xs text-amber-300">Loading...</span>}
              </div>

              {error && <div className="mb-3 rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">{error}</div>}

              {!loading && !error && displayRows.length === 0 && (
                <div className="rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300">
                  {selectedRelatedId ? "No matching rows for this cross-reference filter." : "No rows found in this table."}
                </div>
              )}

              {!error && displayRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column} className="border-b border-slate-700 px-2 py-2 font-semibold text-slate-300">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-slate-800/80">
                          {columns.map((column) => (
                            <td key={column} className="max-w-xs px-2 py-2 align-top text-slate-200">
                              <div className="line-clamp-3 break-all">{typeof row[column] === "object" ? JSON.stringify(row[column]) : String(row[column] ?? "")}</div>
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
