"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BarChart3, RefreshCcw, TrendingDown } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import { useAuthStore } from "@/lib/stores/authStore";
import { AiNotice, aiFetch, panel, primary, secondary, postJson } from "./ui";

type Overview = { forecasts: number; lowConfidence: number; alerts: number;
  alertTypes: { type: string; count: number }[]; trend: {time: string;value: number}[]; partial: boolean };
type Forecast = {id:string; product_id:string; batch_id:string|null; confidence:string;
  predicted_daily_units:number; available:number; predicted_stockout_date:string|null};
const alertLabels:Record<string,string> = {
  low_stock:"Tồn kho thấp", near_expiry:"Lô cận hạn", overstock:"Tồn kho dư"
};
const confidenceLabels:Record<string,string> = {low:"Thấp",medium:"Trung bình",high:"Cao"};

/** Inventory ONLY. Pricing suggestions and approval live in AiPricingIntelligence. */
export default function AiOverview({embedded = false}:{embedded?:boolean}) {
  const role=useAuthStore(state=>state.user?.role_name??state.session?.role_name)?.toLowerCase();
  const [storeId,setStoreId]=useState("");
  const [stores,setStores]=useState<{store_id:string;name:string}[]>([]);
  const [stats,setStats]=useState<Overview|null>(null);
  const [forecasts,setForecasts]=useState<Forecast[]>([]);
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{if(role!=="admin")return;
    let active=true;
    void aiFetch<{items?:{store_id:string;name:string}[]}>("/api/stores")
      .then(data=>{if(!active)return;const choices=data.items??[];setStores(choices);setStoreId(choices[0]?.store_id??"");})
      .catch(()=>{if(active)setStores([]);});
    return()=>{active=false;};
  },[role]);
  const ready=role!=="admin"||Boolean(storeId);
  const query=storeId?`?storeId=${encodeURIComponent(storeId)}`:"";
  const reload=useCallback(async()=>{
    if(!ready)return;
    setLoading(true);
    try{
      const [overview,forecast]=await Promise.all([
        aiFetch<Overview>(`/api/ai/dashboard${query}`),
        aiFetch<{items:Forecast[]}>(`/api/ai/forecast${query}`)
      ]);
      setStats(overview);setForecasts(forecast.items);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Không thể tải phân tích tồn kho");}
    finally{setLoading(false);}
  },[ready,query]);
  useEffect(()=>{void reload();},[reload]);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==="visible")void reload();};
    window.addEventListener("greenplus:data-updated",refresh);
    return()=>window.removeEventListener("greenplus:data-updated",refresh);
  },[reload]);
  const run=async()=>{
    setBusy(true);setError("");setNotice("");
    try{await aiFetch("/api/ai/forecast",postJson({storeId:storeId||undefined}));
      setNotice("Đã tính lại dự báo từ dữ liệu tồn kho và lịch sử bán của cửa hàng.");await reload();}
    catch(e){setError(e instanceof Error?e.message:"Không thể tính lại dự báo");}
    finally{setBusy(false);}
  };
  const maxAlert=Math.max(1,...(stats?.alertTypes??[]).map(item=>item.count));
  const maxTrend=Math.max(1,...(stats?.trend??[]).map(item=>item.value));
  const content=<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold text-slate-900">AI phân tích tồn kho</h2>
        <p className="text-sm text-slate-500">Nhu cầu, nguy cơ hết hàng, hạn sử dụng và mức độ tin cậy của dự báo.</p></div>
      <button type="button" className={secondary} disabled={!ready||loading||busy} onClick={()=>void reload()}>
        <RefreshCcw className="mr-2 inline" size={16}/>Tải lại dữ liệu</button>
    </div>
    {role==="admin"?<label className="block text-sm font-semibold">Cửa hàng
      <select className="ml-2 rounded-lg border p-2" value={storeId} onChange={e=>setStoreId(e.target.value)}>
        <option value="">Chọn cửa hàng</option>{stores.map(item=><option key={item.store_id} value={item.store_id}>{item.name}</option>)}
      </select></label>:null}
    {error?<AiNotice kind="error">{error}</AiNotice>:null}
    {notice?<AiNotice>{notice}</AiNotice>:null}
    {stats?<div className="grid gap-3 sm:grid-cols-3">
      {[{label:"Bản ghi dự báo",value:stats.forecasts,icon:BarChart3},
        {label:"Cảnh báo đang mở",value:stats.alerts,icon:AlertTriangle},
        {label:"Dự báo độ tin cậy thấp",value:stats.lowConfidence,icon:TrendingDown}].map(({label,value,icon:Icon})=><div key={label} className={panel}>
          <Icon size={20} className="mb-2 text-emerald-700"/><p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p></div>)}</div>:null}
    {stats?.partial?<AiNotice kind="error">Thống kê chỉ bao gồm một phần dữ liệu do giới hạn số bản ghi. Không dùng làm kết luận cho toàn kho.</AiNotice>:null}
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={panel}><h3 className="mb-4 font-bold">Cơ cấu cảnh báo tồn kho</h3>
        {(stats?.alertTypes??[]).map(item=><div className="mb-4" key={item.type}>
          <div className="mb-1 flex justify-between text-sm"><span>{alertLabels[item.type]??item.type}</span><span>{item.count}</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{width:`${100*item.count/maxAlert}%`}}/></div>
        </div>)}
        <Link href="/inventories?tab=alerts" className="text-sm font-semibold text-emerald-700 underline">Xem chi tiết cảnh báo</Link>
      </section>
      <section className={panel}><h3 className="mb-2 font-bold">Chạy dự báo nhu cầu</h3>
        <p className="mb-4 text-sm text-slate-600">Sử dụng tồn kho và tối đa 90 ngày lịch sử đơn hàng của cửa hàng. Khi dữ liệu quá ít, độ tin cậy được đánh dấu thấp.</p>
        {role==="manager"?<button disabled={busy||loading} className={primary} onClick={()=>void run()}>
          {busy?"Đang phân tích...":"Cập nhật dự báo tồn kho"}</button>:<p className="text-sm text-slate-500">Chỉ Manager được chạy phân tích.</p>}
      </section>
    </div>
    <section className={panel}><h3 className="mb-2 font-bold">Các lần dự báo gần đây</h3>
      <p className="mb-3 text-xs text-slate-500">Mỗi cột là một bản ghi nhu cầu dự báo theo lần chạy; không phải số lượng bán thực tế.</p>
      {(stats?.trend?.length??0)>0?<div className="flex h-36 items-end gap-1 overflow-x-auto" role="img" aria-label="Biểu đồ bản ghi dự báo nhu cầu">
        {stats?.trend.slice(-24).map((item,index)=><div key={`${item.time}-${index}`} className="min-w-3 flex-1 rounded-t bg-emerald-500" title={`${item.time}: ${item.value}`} style={{height:`${Math.max(3,100*item.value/maxTrend)}%`}}/>)}</div>
        :<p className="text-sm text-slate-500">Chưa có dữ liệu dự báo.</p>}
    </section>
    <section className={panel}><h3 className="mb-3 font-bold">Sản phẩm có dự báo gần đây</h3>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr className="border-b text-slate-500"><th className="p-2">Sản phẩm / lô</th><th className="p-2">Tồn</th><th className="p-2">Nhu cầu/ngày</th><th className="p-2">Dự kiến hết hàng</th><th className="p-2">Độ tin cậy</th></tr></thead>
        <tbody>{forecasts.slice(0,20).map(item=><tr className="border-b border-slate-100" key={item.id}>
          <td className="p-2">{item.product_id.slice(0,8)}{item.batch_id?` / ${item.batch_id.slice(0,8)}`:""}</td>
          <td className="p-2">{item.available}</td><td className="p-2">{Number(item.predicted_daily_units).toFixed(1)}</td>
          <td className="p-2">{item.predicted_stockout_date??"Chưa đủ dữ liệu"}</td>
          <td className="p-2">{confidenceLabels[item.confidence]??item.confidence}</td></tr>)}</tbody>
      </table></div>{!forecasts.length?<p className="py-3 text-sm text-slate-500">Chưa có dự báo. Chạy phân tích để bắt đầu.</p>:null}
      <p className="mt-3 text-xs text-slate-500">Để xử lý mức giảm giá và duyệt khuyến mãi, vào <Link className="font-semibold text-emerald-700 underline" href="/prices?tab=suggestions">Giá → Đề xuất AI</Link>.</p>
    </section>
  </div>;
  return embedded?content:<AdminShell title="AI tồn kho" description="Phân tích nhu cầu và cảnh báo theo từng cửa hàng.">{content}</AdminShell>;
}
