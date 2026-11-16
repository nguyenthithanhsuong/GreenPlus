"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { AlertTriangle,BarChart3,BrainCircuit,RefreshCcw,ShieldCheck } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import { useAuthStore } from "@/lib/stores/authStore";
import { AiNotice,aiFetch,panel,primary,secondary,postJson } from "./ui";

type Overview={forecasts:number;lowConfidence:number;alerts:number;alertTypes:{type:string;count:number}[];suggestions:number;pending:number;approved:number;complaints:number;knowledgeEntries:number;trend:{time:string;value:number}[];partial:boolean};
type Suggestion={id:string;product_id:string;status:string;reason:string;suggested_discount_pct:number;expected_sell_through:number|null};
type Forecast={id:string;product_id:string;batch_id:string|null;confidence:string;model_version:string;predicted_daily_units:number;available:number;predicted_stockout_date:string|null};
export default function AiOverview() {
  const role=useAuthStore((state)=>state.user?.role_name??state.session?.role_name)?.toLowerCase();
  const manager=role==="manager";
  const [storeId,setStoreId]=useState("");
  const [stores,setStores]=useState<{store_id:string;name:string}[]>([]);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [forecasts,setForecasts]=useState<Forecast[]>([]);
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const [busy,setBusy]=useState(false);
  const [customDiscount,setCustomDiscount]=useState<Record<string,string>>({});
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{if(role!=="admin")return;void aiFetch<{items?:{store_id:string;name:string}[]}>("/api/stores").then((v)=>setStores(v.items??[])).catch(()=>setStores([]));},[role]);
  const query=storeId?`?storeId=${encodeURIComponent(storeId)}`:"";
  const reload=useCallback(async()=>{
    try {
      const [stats,forecast,suggestionsResult]=await Promise.all([
        aiFetch<Overview>(`/api/ai/dashboard${query}`),
        aiFetch<{items:Forecast[]}>(`/api/ai/forecast${query}`),
        aiFetch<{items:Suggestion[]}>(`/api/ai/suggestions${query}`),
      ]);
      setOverview(stats);setForecasts(forecast.items);setSuggestions(suggestionsResult.items);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Không tải được dữ liệu AI");}
  },[query]);
  useEffect(()=>{if(role!=="admin"||storeId)void reload();},[reload,role,storeId]);
  const action=async(path:string,body:unknown)=>{
    setBusy(true);setError("");setNotice("");
    try {await aiFetch(path,postJson(body));setNotice("Đã cập nhật. Dữ liệu được ghi theo cửa hàng.");await reload();}
    catch(e){setError(e instanceof Error?e.message:"Yêu cầu không thành công");}
    finally{setBusy(false);}
  };
  const max=Math.max(1,...(overview?.alertTypes??[]).map((item)=>item.count));
  return <AdminShell title="AI tồn kho & khuyến mãi" description="Dự báo có đánh giá độ tin cậy; mọi khuyến mãi phải do Manager duyệt." pageActions={<button className={secondary} onClick={()=>void reload()}><RefreshCcw size={16} className="mr-2 inline"/>Làm mới</button>}>
    {role==="admin"?<div className={panel}><label htmlFor="ai-store" className="mb-2 block text-sm font-semibold">Cửa hàng cần xem</label><select id="ai-store" className="rounded-xl border p-2" value={storeId} onChange={e=>setStoreId(e.target.value)}><option value="">Chọn cửa hàng</option>{stores.map((item)=><option key={item.store_id} value={item.store_id}>{item.name}</option>)}</select></div>:null}
    {error?<AiNotice kind="error">{error}</AiNotice>:null}{notice?<AiNotice>{notice}</AiNotice>:null}
    {overview?<div className="grid gap-4 md:grid-cols-4">{[
      {label:"Bản ghi dự báo",value:overview.forecasts,icon:BarChart3},
      {label:"Cảnh báo kho",value:overview.alerts,icon:AlertTriangle},
      {label:"Đề xuất chờ duyệt",value:overview.pending,icon:BrainCircuit},
      {label:"FAQ đang hoạt động",value:overview.knowledgeEntries,icon:ShieldCheck},
    ].map(({label,value,icon:Icon})=><div className={panel} key={label}><Icon className="mb-3 text-emerald-600"/><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold text-slate-900">{value}</p></div>)}</div>:null}
    {overview?.partial?<AiNotice kind="error">Chỉ phân tích một phần dữ liệu do giới hạn số bản ghi. Không dùng làm kết luận toàn kho.</AiNotice>:null}
    <div className="grid gap-5 xl:grid-cols-2"><section className={panel}><h2 className="mb-4 text-lg font-bold">Cơ cấu cảnh báo</h2>{(overview?.alertTypes??[]).map((item)=><div key={item.type} className="mb-4"><div className="mb-1 flex justify-between text-sm"><span>{item.type}</span><span>{item.count}</span></div><div className="h-3 overflow-hidden rounded-full bg-emerald-50"><div className="h-full rounded-full bg-emerald-600" style={{width:`${100*item.count/max}%`}}/></div></div>)}<Link className="text-emerald-700 underline" href="/ai/alerts">Xem cảnh báo chi tiết</Link></section>
    <section className={panel}><h2 className="mb-2 text-lg font-bold">Chạy phân tích</h2><p className="mb-4 text-sm text-slate-600">Dữ liệu tồn kho và 90 ngày đơn hàng đã lọc store. Khi lịch sử quá ngắn, mô hình báo độ tin cậy thấp.</p><div className="flex flex-wrap gap-2">{manager?<><button className={primary} disabled={busy} onClick={()=>void action("/api/ai/forecast",{storeId:storeId||undefined})}>Cập nhật dự báo</button><button className={secondary} disabled={busy} onClick={()=>void action("/api/ai/suggestions",{storeId:storeId||undefined})}>Tạo đề xuất</button></>:<p className="text-sm text-slate-500">Admin chỉ xem dữ liệu phân tích, không duyệt khuyến mãi.</p>}</div></section></div>
    <section className={panel}><h2 className="mb-4 text-lg font-bold">Diễn biến nhu cầu dự báo</h2>
      <p className="mb-3 text-xs text-slate-500">Dữ liệu tổng hợp từ các lần chạy mô hình; không phải doanh số thực tế.</p>
      <div className="flex h-40 items-end gap-2 overflow-x-auto" role="img" aria-label="Biểu đồ nhu cầu dự báo qua các lần chạy">
        {(overview?.trend??[]).slice(-24).map((row,index)=><div key={index} className="flex h-full min-w-4 flex-1 flex-col justify-end" title={`${row.time}: ${row.value}`}><div className="rounded-t bg-emerald-500" style={{height:`${Math.max(3,100*row.value/Math.max(1,...(overview?.trend??[]).map(x=>x.value)))}%`}}/></div>)}
      </div></section>
    <section className={panel}><h2 className="mb-4 text-lg font-bold">Đề xuất khuyến mãi</h2><div className="space-y-3">{suggestions.length?suggestions.slice(0,12).map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="font-semibold">{item.suggested_discount_pct}% — {item.status}</p><p className="max-w-xl text-sm text-slate-600">{item.reason}</p><p className="text-xs text-slate-400">{item.product_id}</p></div>{manager&&item.status==="pending"?<div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">Mức giảm duyệt (%)<input type="number" min={1} max={50} step={1} className="ml-2 w-20 rounded-lg border border-slate-200 p-2" value={customDiscount[item.id]??String(item.suggested_discount_pct)} onChange={event=>setCustomDiscount(current=>({...current,[item.id]:event.target.value}))}/></label><button disabled={busy||!Number(customDiscount[item.id]??item.suggested_discount_pct)} className={primary} onClick={()=>void action(`/api/ai/suggestions/${item.id}/decision`,{storeId:storeId||undefined,decision:"accepted",discount:Number(customDiscount[item.id]??item.suggested_discount_pct)})}>Duyệt</button><button disabled={busy} className={secondary} onClick={()=>void action(`/api/ai/suggestions/${item.id}/decision`,{storeId:storeId||undefined,decision:"rejected"})}>Từ chối</button></div>:null}</article>):<p className="text-sm text-slate-500">Chưa có đề xuất.</p>}</div></section>
    <section className={panel}><h2 className="mb-4 text-lg font-bold">Dự báo gần đây</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Sản phẩm</th><th className="p-2">Tồn</th><th className="p-2">Nhu cầu/ngày</th><th className="p-2">Hết hàng dự kiến</th><th className="p-2">Độ tin cậy</th></tr></thead><tbody>{forecasts.slice(0,20).map((row)=><tr key={row.id} className="border-b border-slate-100"><td className="p-2">{row.product_id.slice(0,8)}</td><td className="p-2">{row.available}</td><td className="p-2">{Number(row.predicted_daily_units).toFixed(1)}</td><td className="p-2">{row.predicted_stockout_date??"Chưa đủ dữ liệu"}</td><td className="p-2">{row.confidence}</td></tr>)}</tbody></table></div></section>
  </AdminShell>;
}
