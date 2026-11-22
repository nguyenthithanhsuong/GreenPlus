'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Config={base_fee:number;per_km:number;min_fee:number;free_from:number;max_radius_km:number;distance_factor:number};
type Store={store_id:string;name:string};
type Result={stores:Store[];storeId:string|null;config:Config|null;updatedAt:string|null;error?:string};
const fields:[keyof Config,string,string][]=[
  ['base_fee','Phí khởi điểm (VND)','Phí mặc định trước khi tính khoảng cách'],
  ['per_km','Phí mỗi km (VND)','Tính theo khoảng cách ước lượng'],
  ['min_fee','Phí tối thiểu (VND)','Không áp dụng khi đủ điều kiện miễn phí'],
  ['max_radius_km','Bán kính giao hàng tối đa (km)','Vượt phạm vi sẽ không nhận đơn'],
  ['distance_factor','Hệ số hiệu chỉnh khoảng cách','1–3; không thay thế khoảng cách đường bộ thật'],
];
export default function ShippingSettingsPage() {
  const [stores,setStores]=useState<Store[]>([]);
  const [storeId,setStoreId]=useState('');
  const [config,setConfig]=useState<Config|null>(null);
  const [updatedAt,setUpdatedAt]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`/api/settings/shipping${storeId?`?storeId=${encodeURIComponent(storeId)}`:''}`,{cache:'no-store',signal:controller.signal})
      .then(async response=>{const data=await response.json() as Result;if(!response.ok)throw Error(data.error||'Không tải được cấu hình');return data;})
      .then(data=>{setStores(data.stores);setStoreId(data.storeId??'');setConfig(data.config);setUpdatedAt(data.updatedAt);setMessage('');})
      .catch(err=>{if(!controller.signal.aborted)setMessage(err instanceof Error?err.message:'Không thể tải cấu hình');});
    return()=>controller.abort();
  },[storeId]);
  async function save() {
    if(!config||!storeId)return;
    setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/settings/shipping',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({storeId,config,updatedAt})});
      const data=await response.json() as {error?:string;updatedAt?:string};
      if(!response.ok)throw Error(data.error||'Lưu thất bại');
      setUpdatedAt(data.updatedAt??null);setMessage('Đã lưu cấu hình phí giao hàng của cửa hàng.');
    }catch(err){setMessage(err instanceof Error?err.message:'Lưu thất bại');}
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#f3f8f4] px-4 py-8 text-slate-800 sm:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <div><Link href="/settings" className="text-sm font-semibold text-emerald-700 hover:underline">← Cài đặt</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Cấu hình phí vận chuyển</h1>
      <p className="mt-2 text-base text-slate-600">Phí được tính trên máy chủ, theo cửa hàng. Khách hàng không được tự thay đổi phí khi đặt hàng.</p></div>
      <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:p-8">
        <label htmlFor="store" className="block text-base font-semibold">Cửa hàng</label>
        <select id="store" value={storeId} onChange={event=>setStoreId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base md:max-w-md">
          {stores.map(store=><option value={store.store_id} key={store.store_id}>{store.name}</option>)}
        </select>
        {config?<div className="mt-7 grid gap-6 md:grid-cols-2">{fields.map(([key,label,help])=><label key={key} className="block"><span className="text-base font-semibold">{label}</span><span className="mt-1 block text-sm text-slate-500">{help}</span>
          <input type="number" min={key==='distance_factor'||key==='max_radius_km'?1:0} max={key==='distance_factor'?3:undefined} step={key==='distance_factor'||key==='max_radius_km'?'0.05':'1000'} value={config[key]} onChange={e=>setConfig(current=>current?{...current,[key]:Number(e.target.value)}:current)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"/>
        </label>)}</div>:<p className="mt-6 text-slate-500">Chọn cửa hàng để xem cấu hình.</p>}
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Khoảng cách hiện là đường chim bay nhân hệ số, <strong>chưa phải quãng đường lái xe từ Google Maps/Mapbox</strong>. Khi thiếu tọa độ cửa hàng sẽ áp dụng phí cố định. Chưa tự động áp dụng ngưỡng miễn phí từ tổng giỏ hàng.</p>
        {message&&<p role="status" className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
        <button type="button" onClick={save} disabled={!config||busy} className="mt-6 rounded-xl bg-emerald-700 px-7 py-3 text-base font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">{busy?'Đang lưu...':'Lưu quy tắc phí vận chuyển'}</button>
      </section>
    </div>
  </main>;
}
