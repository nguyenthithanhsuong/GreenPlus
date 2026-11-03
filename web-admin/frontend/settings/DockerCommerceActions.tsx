"use client";

import { useState, type FormEvent } from "react";

type Action = "restock" | "checkout" | "cancel" | "simulate-payment" | "assign-delivery" | "complete-delivery";
const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Privileged local demo actions only; not the customer checkout/payment interface. */
export default function DockerCommerceActions({storeId, onSuccess}: {storeId:string; onSuccess:()=>void}) {
  const [action,setAction]=useState<Action>("restock");
  const [productId,setProductId]=useState("");
  const [quantity,setQuantity]=useState("1");
  const [orderId,setOrderId]=useState("");
  const [assignee,setAssignee]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function execute(event: FormEvent) {
    event.preventDefault();setError("");setMessage("");
    if (!storeId) return;
    const amount=Number(quantity);
    if ((action === "restock" || action === "checkout") && (!pattern.test(productId) || !Number.isInteger(amount) || amount < 1 || amount > (action === "restock" ? 100000 : 1000))) {
      setError("Product ID hoặc số lượng không hợp lệ");return;
    }
    if (action !== "restock" && !pattern.test(orderId)) {setError("Order ID phải là UUID hợp lệ");return;}
    if (action === "assign-delivery" && (!assignee.trim() || assignee.length > 120)) {setError("Cần nhập người giao hàng");return;}
    if (!window.confirm(`Thực hiện ${action} trên Docker Local? Thao tác này ghi dữ liệu thử nghiệm.`)) return;
    const payload: Record<string,unknown>={action,storeId};
    if (action === "restock") {payload.productId=productId;payload.quantity=amount;}
    if (action === "checkout") {payload.orderId=orderId;payload.items=[{product_id:productId,quantity:amount}];}
    if (["cancel","simulate-payment","assign-delivery","complete-delivery"].includes(action)) payload.orderId=orderId;
    if (action === "assign-delivery") payload.assignedTo=assignee.trim();
    setBusy(true);
    try {
      const response=await fetch("/api/tenant-demo/commerce",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json();
      if (!response.ok) throw new Error(result.error || "Thao tác không thành công");
      setMessage(`Thành công: ${JSON.stringify(result)}`);onSuccess();
    } catch (cause) {setError(cause instanceof Error?cause.message:"Docker không khả dụng");}
    finally {setBusy(false);}
  }
  return <form onSubmit={execute} className="space-y-3 rounded-xl border p-4">
    <h3 className="font-semibold">Thử nghiệp vụ Docker (sandbox)</h3>
    <p className="text-sm text-amber-700">Thanh toán là mô phỏng, không kết nối cổng thanh toán thật.</p>
    <label className="block text-sm">Thao tác
      <select className="mt-1 w-full rounded border p-2" value={action} onChange={e=>setAction(e.target.value as Action)}>
        <option value="restock">Nhập tồn kho</option><option value="checkout">Checkout demo (trừ tồn)</option>
        <option value="cancel">Hủy đơn chưa thanh toán (hoàn tồn)</option>
        <option value="simulate-payment">Mô phỏng xác nhận thanh toán</option>
        <option value="assign-delivery">Phân công giao hàng</option><option value="complete-delivery">Hoàn tất giao hàng</option>
      </select>
    </label>
    {(action === "restock" || action === "checkout") && <>
      <label className="block text-sm">Product UUID<input className="mt-1 w-full rounded border p-2" required value={productId} onChange={e=>setProductId(e.target.value)}/></label>
      <label className="block text-sm">Số lượng<input type="number" className="mt-1 w-full rounded border p-2" min="1" max={action==="restock"?100000:1000} required value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
    </>}
    {action !== "restock" && <label className="block text-sm">Order UUID<input className="mt-1 w-full rounded border p-2" required value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="Tạo UUID duy nhất khi checkout"/></label>}
    {action === "assign-delivery" && <label className="block text-sm">Người giao hàng<input className="mt-1 w-full rounded border p-2" required maxLength={120} value={assignee} onChange={e=>setAssignee(e.target.value)}/></label>}
    <button type="submit" disabled={busy} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">{busy?"Đang xử lý...":"Thực hiện trên Docker"}</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="break-all text-sm text-emerald-700">{message}</p>}
  </form>;
}
