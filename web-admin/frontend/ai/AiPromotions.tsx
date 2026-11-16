"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "../shared/AdminShell";
import { AiNotice, aiFetch, panel, primary, field, postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Promotion = {
  id: string;
  product_id: string;
  scope: string;
  discount_value: number;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
};
type Product = { product_id: string; name: string };
type Batch = { batch_id: string; product_id: string; expire_date: string };
type ProductOptions = { products: Product[]; batches: Batch[]; partial: boolean };

export default function AiPromotions() {
  const { role, storeId, storeQuery, storePicker, ready } = useAiScope();
  const [items, setItems] = useState<Promotion[]>([]);
  const [options, setOptions] = useState<ProductOptions>({ products: [], batches: [], partial: false });
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [discount, setDiscount] = useState(10);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [promotions, productOptions] = await Promise.all([
        aiFetch<{ items: Promotion[] }>(`/api/ai/promotions${storeQuery}`),
        role === "manager"
          ? aiFetch<ProductOptions>(`/api/ai/product-options${storeQuery}`)
          : Promise.resolve({ products: [], batches: [], partial: false }),
      ]);
      setItems(promotions.items);
      setOptions(productOptions);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được chương trình");
    }
  }, [role, storeQuery]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const selectedBatches = options.batches.filter((batch) => batch.product_id === productId);
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await aiFetch("/api/ai/promotions", postJson({
        storeId: storeId || undefined,
        productId,
        batchId: batchId || undefined,
        discount,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }));
      setProductId("");
      setBatchId("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tạo được khuyến mãi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Chương trình khuyến mãi" description="Khuyến mãi áp dụng theo sản phẩm hoặc lô, phải được Manager duyệt.">
      {storePicker}
      {error ? <AiNotice kind="error">{error}</AiNotice> : null}
      {role === "manager" ? (
        <section className={panel}>
          <h2 className="mb-3 font-bold">Tạo khuyến mãi thủ công</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Sản phẩm
              <select className={`${field} mt-1`} value={productId} onChange={(event) => {
                setProductId(event.target.value);
                setBatchId("");
              }}>
                <option value="">Chọn sản phẩm đang bán</option>
                {options.products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Lô hàng (không bắt buộc)
              <select className={`${field} mt-1`} value={batchId} disabled={!productId} onChange={(event) => setBatchId(event.target.value)}>
                <option value="">Toàn bộ sản phẩm</option>
                {selectedBatches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    Lô {batch.batch_id.slice(0, 8)} · HSD {batch.expire_date}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Mức giảm (%)
              <input className={`${field} mt-1`} type="number" min={1} max={50} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
            </label>
            <span />
            <label className="text-sm">
              Bắt đầu
              <input type="datetime-local" className={`${field} mt-1`} value={startAt} onChange={(event) => setStartAt(event.target.value)} />
            </label>
            <label className="text-sm">
              Kết thúc
              <input type="datetime-local" className={`${field} mt-1`} value={endAt} onChange={(event) => setEndAt(event.target.value)} />
            </label>
          </div>
          {options.partial ? <AiNotice kind="error">Danh sách sản phẩm/lô vượt giới hạn tải. Hãy xử lý trực tiếp trong danh mục trước khi tạo khuyến mãi.</AiNotice> : null}
          <button className={`${primary} mt-3`} disabled={busy || options.partial || !productId || !startAt || !endAt || discount < 1 || discount > 50 || new Date(endAt) <= new Date(startAt)} onClick={() => void create()}>
            Tạo chương trình
          </button>
        </section>
      ) : null}
      <section className={panel}>
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 p-4">
              <p className="font-semibold">{item.discount_value}% · {item.status} · {item.scope}</p>
              <p className="text-sm text-slate-500">Sản phẩm {item.product_id.slice(0, 8)} · {item.source}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(item.start_at).toLocaleDateString("vi-VN")} — {new Date(item.end_at).toLocaleDateString("vi-VN")}
              </p>
            </article>
          ))}
          {!items.length ? <p className="text-slate-500">Chưa có chương trình.</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
