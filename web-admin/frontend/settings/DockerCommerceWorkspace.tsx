"use client";
import {useEffect, useState, useSyncExternalStore} from "react";
import Link from "next/link";
import DockerCommerceInspector from "./DockerCommerceInspector";
import AdminShell from "../shared/AdminShell";
import CommerceTabs from "../shared/CommerceTabs";
import { useAuthStore } from "@/lib/stores/authStore";

type Store={store_id:string;name:string;tier:string};
type InventorySection = "commerce" | "alerts" | "forecast";

// The URL is external state. Read it via useSyncExternalStore instead of
// synchronously cascading setState calls from effects.
function subscribeToUrlChanges(onChange: () => void) {
 window.addEventListener("popstate", onChange);
 return () => window.removeEventListener("popstate", onChange);
}
function getUrlSection(): InventorySection {
 const tab = new URLSearchParams(window.location.search).get("tab");
 return tab === "alerts" || tab === "forecast" ? tab : "commerce";
}
function getServerSection(): InventorySection { return "commerce"; }
/** Main Admin Orders/Inventory pages switch to this separate Docker sandbox only. */
export default function DockerCommerceWorkspace({kind}:{kind:"inventory"|"orders"}) {
 const [stores,setStores]=useState<Store[]>([]);
 const [storeId,setStoreId]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [selectedSection,setSelectedSection]=useState<InventorySection|null>(null);
 const role = useAuthStore(s => s.user?.role_name ?? s.session?.role_name)?.toLowerCase();
 const urlSection = useSyncExternalStore(subscribeToUrlChanges, getUrlSection, getServerSection);
 // Do not expose manager-only tabs when roles change: derive the permitted
 // section instead of resetting it in a render-triggering effect.
 const section: InventorySection = kind === "inventory" && role === "manager"
  ? (selectedSection ?? urlSection)
  : "commerce";
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/tenant-demo",{cache:"no-store",signal:controller.signal})
   .then(async response=>{const value=await response.json();if(!response.ok)throw new Error(value.error||"Không thể tải cửa hàng");return value;})
   .then((value:{items?:Store[]})=>{
    const next=Array.isArray(value.items)?value.items:[];
    setStores(next);setStoreId(current=>next.some(row=>row.store_id===current)?current:next[0]?.store_id??"");
   })
   .catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Docker không khả dụng");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[]);
 return <AdminShell title={kind==="inventory"?"Quản lý tồn kho":"Quản lý đơn hàng"}
  description="Docker Local Sandbox · dữ liệu mô phỏng chưa thay thế Supabase nghiệp vụ"
  pageActions={<Link href="/system" className="text-sm font-semibold text-emerald-700 underline">Cấu hình nguồn dữ liệu</Link>}>
  {kind==="inventory" && <CommerceTabs current={section} onChange={id=>setSelectedSection(id as InventorySection)} tabs={[
    { id:"commerce", label:"Tồn kho Docker" },
    ...(role === "manager" ? [
      { id:"alerts", label:"Cảnh báo tồn kho AI" },
      { id:"forecast", label:"Dự báo tồn kho AI" },
    ] : []),
  ]} />}
  {kind==="inventory" && role==="manager" && section!=="commerce" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-slate-800">
    <h2 className="font-bold">{section==="alerts"?"Cảnh báo tồn kho AI":"Dự báo tồn kho AI"}</h2>
    <p className="mt-2">Chức năng AI vẫn được giữ trong điều hướng. Nhưng dữ liệu của Docker sandbox chưa có adapter AI hoàn chỉnh: API AI hiện truy vấn Supabase, không truy vấn PostgreSQL 17 Docker. Hệ thống không tự ghép dữ liệu của hai cửa hàng khác nguồn.</p>
    <p className="mt-2">Để chạy AI trên dữ liệu thật hiện tại, chọn lại nguồn Supabase trong cấu hình và mở tab AI ở trang nghiệp vụ. Để dùng AI với Docker cần kết nối adapter theo tenant, Auth và Storage trước khi xác nhận full parity.</p>
  </section>}
  {(kind!=="inventory" || section==="commerce" || role!=="manager") && <>{loading&&<p>Đang tải cửa hàng Docker...</p>}
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  {!loading&&!error&&!stores.length&&<p>Chưa có tenant demo. <Link href="/settings/tenant-demo" className="underline">Tạo thử nghiệm</Link></p>}
  {stores.length>0&&<label className="block max-w-md text-sm">Cửa hàng Docker<select className="mt-1 w-full rounded border p-2" value={storeId} onChange={e=>setStoreId(e.target.value)}>{stores.map(row=><option key={row.store_id} value={row.store_id}>{row.name} ({row.tier})</option>)}</select></label>}
  {storeId&&<DockerCommerceInspector key={`${storeId}:${kind}`} storeId={storeId} initialTab={kind}/>}
  </>}
 </AdminShell>;
}
