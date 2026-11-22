"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
  image_url?: string | null;
};
type Product = { product_id: string; name: string };
type Batch = { batch_id: string; product_id: string; expire_date: string };
type ProductOptions = { products: Product[]; batches: Batch[]; partial: boolean };

export default function AiPromotions({ embedded = false }: { embedded?: boolean }) {
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
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadImage = async (file: File) => {
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.append("file",file); if(storeId)body.append("storeId",storeId);
      const response = await fetch("/api/ai/promotions/image",{method:"POST",body});
      const data = await response.json() as {imageUrl?:string;error?:string};
      if(!response.ok || !data.imageUrl)throw new Error(data.error||"Không thể tải ảnh");
      setImageUrl(data.imageUrl);
    } catch(cause){setError(cause instanceof Error?cause.message:"Không thể tải ảnh");}
    finally{setUploading(false);}
  };

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
    if (!ready) return;
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("greenplus:data-updated", refresh);
    return () => window.removeEventListener("greenplus:data-updated", refresh);
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
        imageUrl: imageUrl || undefined,
      }));
      setProductId("");
      setBatchId(""); setImageUrl("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tạo được khuyến mãi");
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <>
      {!embedded && storePicker}
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
          <label className="mt-3 block text-sm font-semibold">Ảnh chương trình khuyến mãi (tuỳ chọn)
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || busy} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" onChange={event=>{const file=event.target.files?.[0];if(file)void uploadImage(file);}} />
          </label>
          {uploading && <p className="mt-2 text-sm text-slate-500">Đang tải ảnh...</p>}
          {imageUrl && <div className="mt-2 flex items-center gap-3"><Image unoptimized src={imageUrl} width={128} height={96} alt="Ảnh xem trước chương trình" className="h-24 w-32 rounded-xl object-cover"/><button type="button" className="text-sm font-semibold text-red-700" onClick={()=>setImageUrl("")}>Bỏ ảnh</button></div>}
          {options.partial ? <AiNotice kind="error">Danh sách sản phẩm/lô vượt giới hạn tải. Hãy xử lý trực tiếp trong danh mục trước khi tạo khuyến mãi.</AiNotice> : null}
          <button className={`${primary} mt-3`} disabled={busy || uploading || options.partial || !productId || !startAt || !endAt || discount < 1 || discount > 50 || new Date(endAt) <= new Date(startAt)} onClick={() => void create()}>
            Tạo chương trình
          </button>
        </section>
      ) : null}
      <section className={panel}>
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 p-4">
              {item.image_url && <Image unoptimized src={item.image_url} width={640} height={112} alt="Ảnh khuyến mãi" className="mb-3 h-28 w-full rounded-xl object-cover" />}
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
    </>
  );
  return embedded ? content : <AdminShell title="Chương trình khuyến mãi" description="Khuyến mãi áp dụng theo sản phẩm hoặc lô, phải được Manager duyệt.">{content}</AdminShell>;
}
