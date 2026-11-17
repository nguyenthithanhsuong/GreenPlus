"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import {RefreshCcw,Sparkles,Tags,CheckCircle2} from "lucide-react";
import {AiNotice,aiFetch,panel,primary,secondary,postJson} from "./ui";
import {useAiScope} from "./use-ai-scope";

type Suggestion={id:string;product_id:string;batch_id:string|null;status:string;reason:string;
  suggested_discount_pct:number;expected_sell_through:number|null;confidence?:string|null};
type Options={products:{product_id:string;name:string}[];batches:{batch_id:string;expire_date:string}[];partial:boolean};
type Filter="all"|"pending"|"accepted"|"rejected"|"expired";
const statuses:Record<string,string>={pending:"Chờ duyệt",accepted:"Đã duyệt",rejected:"Đã từ chối",expired:"Hết hạn"};

/** Price + promotion recommendations, not an inventory forecast dashboard. */
export default function AiPricingIntelligence(){
  const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
  const [items,setItems]=useState<Suggestion[]>([]);
  const [options,setOptions]=useState<Options>({products:[],batches:[],partial:false});
  const [filter,setFilter]=useState<Filter>("all");
  const [discounts,setDiscounts]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const reload=useCallback(async()=>{
    if(!ready)return;
    setLoading(true);
    try{
      const [data,productOptions]=await Promise.allSettled([
        aiFetch<{items:Suggestion[]}>(`/api/ai/suggestions${storeQuery}`),
        aiFetch<Options>(`/api/ai/product-options${storeQuery}`)
      ]);
      if(data.status==="rejected")throw data.reason;
      setItems(data.value.items);
      if(productOptions.status==="fulfilled")setOptions(productOptions.value);
      setError("");
    }catch(e){setError(e instanceof Error?e.message:"Không tải được đề xuất AI");}
    finally{setLoading(false);}
  },[ready,storeQuery]);
  useEffect(()=>{void reload();},[reload]);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==="visible")void reload();};
    window.addEventListener("greenplus:data-updated",refresh);
    return()=>window.removeEventListener("greenplus:data-updated",refresh);
  },[reload]);
  const visible=useMemo(()=>filter==="all"?items:items.filter(item=>item.status===filter),[filter,items]);
  const names=useMemo(()=>new Map(options.products.map(item=>[item.product_id,item.name])),[options.products]);
  const run=async()=>{
    setBusy(true);setError("");setNotice("");
    try{await aiFetch("/api/ai/suggestions",postJson({storeId:storeId||undefined}));
      setNotice("Đã cập nhật danh sách đề xuất. Khuyến mãi chưa có hiệu lực cho đến khi Manager duyệt.");
      await reload();}
    catch(e){setError(e instanceof Error?e.message:"Không thể tạo đề xuất");}
    finally{setBusy(false);}
  };
  const decide=async(item:Suggestion,decision:"accepted"|"rejected")=>{
    const discount=Number(discounts[item.id]??item.suggested_discount_pct);
    if(decision==="accepted"&&(!Number.isFinite(discount)||discount<1||discount>50)){
      setError("Mức giảm duyệt phải từ 1% đến 50%.");return;
    }
    if(!window.confirm(decision==="accepted"?`Duyệt đề xuất giảm ${discount}%?`:`Từ chối đề xuất của sản phẩm ${names.get(item.product_id)??item.product_id.slice(0,8)}?`))return;
    setBusy(true);setError("");setNotice("");
    try{await aiFetch(`/api/ai/suggestions/${item.id}/decision`,postJson({storeId:storeId||undefined,decision,
      ...(decision==="accepted"?{discount}: {})}));
      setNotice(decision==="accepted"?"Đã duyệt đề xuất khuyến mãi.":"Đã từ chối đề xuất.");await reload();}
    catch(e){setError(e instanceof Error?e.message:"Không cập nhật được quyết định");}
    finally{setBusy(false);}
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h2 className="text-lg font-bold text-slate-900">Đề xuất giá & khuyến mãi AI</h2>
      <p className="text-sm text-slate-500">Xem xét mức giảm theo tồn dư, hạn dùng và dự báo; không thay đổi bảng giá bán trực tiếp.</p>
    </div><button className={secondary} disabled={loading||busy||!ready} onClick={()=>void reload()}>
      <RefreshCcw size={16} className="mr-2 inline"/>Tải lại đề xuất</button></div>
    {storePicker}
    {error?<AiNotice kind="error">{error}</AiNotice>:null}{notice?<AiNotice>{notice}</AiNotice>:null}
    <div className="grid gap-3 sm:grid-cols-3">
      {[{label:"Đề xuất AI",value:items.length,icon:Sparkles},
        {label:"Chờ Manager duyệt",value:items.filter(item=>item.status==="pending").length,icon:Tags},
        {label:"Đã duyệt",value:items.filter(item=>item.status==="accepted").length,icon:CheckCircle2}].map(({label,value,icon:Icon})=><div className={panel} key={label}>
          <Icon size={20} className="mb-2 text-emerald-700"/><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}
    </div>
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div>
        <h3 className="font-bold">Tạo đề xuất khuyến mãi</h3>
        <p className="mt-1 text-sm text-slate-500">Dựa trên dự báo tồn kho đã lưu; không tự áp dụng khuyến mãi.</p>
      </div>{role==="manager"?<button className={primary} disabled={busy||!ready} onClick={()=>void run()}>
          {busy?"Đang xử lý...":"Tạo / cập nhật đề xuất"}</button>:null}</div>
      <p className="mt-3 text-xs text-slate-500">Thiếu dữ liệu dự báo? <Link className="font-semibold text-emerald-700 underline" href="/inventories?tab=forecast">Chạy AI trong Tồn kho</Link> trước.</p>
    </section>
    <section className={panel}><div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold">Danh sách đề xuất ({visible.length})</h3>
      <label className="text-sm text-slate-600">Trạng thái <select className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
        value={filter} onChange={e=>setFilter(e.target.value as Filter)}>
        {(["all","pending","accepted","rejected","expired"] as Filter[]).map(item=><option value={item} key={item}>{item==="all"?"Tất cả":statuses[item]}</option>)}
      </select></label></div>
      {options.partial?<AiNotice kind="error">Danh sách sản phẩm/lô chỉ tải một phần; mã sản phẩm chưa được hiển thị đầy đủ.</AiNotice>:null}
      <div className="space-y-3">{visible.map(item=><article key={item.id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap justify-between gap-2"><div>
          <p className="font-semibold text-slate-900">{names.get(item.product_id)??`Sản phẩm ${item.product_id.slice(0,8)}`}</p>
          <p className="text-xs text-slate-500">{item.batch_id?`Lô ${item.batch_id.slice(0,8)} · `:""}{statuses[item.status]??item.status}</p>
        </div><strong className="text-xl text-emerald-700">Đề xuất -{item.suggested_discount_pct}%</strong></div>
        <p className="mt-2 text-sm text-slate-700">{item.reason}</p>
        {item.expected_sell_through!=null?<p className="mt-2 text-xs text-slate-500">Ước tính bán hết: {Number(item.expected_sell_through).toFixed(0)}% (mô hình, không phải kết quả thực tế)</p>:null}
        {role==="manager"&&item.status==="pending"?<div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <label className="text-sm">Mức giảm duyệt (%)<input type="number" min={1} max={50} step={1}
            className="ml-2 w-20 rounded-lg border p-2" value={discounts[item.id]??String(item.suggested_discount_pct)}
            onChange={e=>setDiscounts(old=>({...old,[item.id]:e.target.value}))}/></label>
          <button className={primary} disabled={busy} onClick={()=>void decide(item,"accepted")}>Duyệt</button>
          <button className={secondary} disabled={busy} onClick={()=>void decide(item,"rejected")}>Từ chối</button></div>:null}
      </article>)}
      {!visible.length?<p className="py-3 text-sm text-slate-500">Chưa có đề xuất ở trạng thái này.</p>:null}</div>
      <p className="mt-4 text-xs text-slate-500">Khuyến mãi được duyệt được theo dõi tại tab <Link href="/prices?tab=promotions" className="font-semibold text-emerald-700 underline">Chương trình khuyến mãi</Link>. Giá chính thức tính theo lô tại checkout.</p>
    </section>
  </div>;
}
