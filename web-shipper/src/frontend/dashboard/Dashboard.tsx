"use client";
import { useState } from 'react';
import { MapPin, PackageCheck, RefreshCw } from 'lucide-react';
import NavigationBar from './NavigationBar';
import { SCREEN_BACKGROUND_GRADIENT,SCREEN_MAX_WIDTH_PX } from '../shared/screen.styles';
import type { Delivery } from '../../lib/delivery-types';

export default function Dashboard(){
 const [token,setToken]=useState('');
 const [items,setItems]=useState<Delivery[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [selected,setSelected]=useState<'assigned'|'in_progress'>('assigned');
 async function load(){
  setLoading(true);setError('');
  try{const response=await fetch('/api/shipper/deliveries',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Không tải được đơn hàng');setItems(data.items);
  }catch(e){setError(e instanceof Error?e.message:'Có lỗi xảy ra');}finally{setLoading(false);}
 }
 async function advance(item:Delivery){
  const next={assigned:'picked_up',picked_up:'delivering',delivering:'delivered',delivered:null}[item.status];
  if(!next)return;
  setLoading(true);setError('');
  try{const response=await fetch(`/api/shipper/deliveries/${encodeURIComponent(item.order_id)}/status`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({currentStatus:item.status,status:next})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Cập nhật thất bại');setItems(old=>old.map(x=>x.order_id===item.order_id?data:x));
  }catch(e){setError(e instanceof Error?e.message:'Cập nhật thất bại');}finally{setLoading(false);}
 }
 const visible=items.filter(item=>selected==='assigned'?item.status==='assigned':item.status!=='assigned'&&item.status!=='delivered');
 return <main className="min-h-screen" style={{background:SCREEN_BACKGROUND_GRADIENT}}><div className="relative mx-auto min-h-screen bg-[#F9FAFB] pb-28" style={{maxWidth:SCREEN_MAX_WIDTH_PX}}>
  <header className="bg-[#15A651] px-5 pb-5 pt-12 text-white"><p className="text-sm opacity-85">GreenPlus • Shipper</p><h1 className="mt-1 text-2xl font-bold">Đơn giao của tôi</h1><p className="mt-1 text-sm opacity-90">Theo dõi đơn được phân công</p></header>
  <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm"><label className="block text-sm font-semibold text-gray-700" htmlFor="sessionToken">Access token của Shipper</label><input id="sessionToken" type="password" value={token} autoComplete="off" onChange={e=>setToken(e.target.value)} placeholder="Nhập token để kết nối API" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900"/><p className="mt-2 text-xs text-gray-500">Bản tích hợp tạm thời: token chỉ giữ trong bộ nhớ trang, không lưu vào trình duyệt. Cần tích hợp đăng nhập thực tế trước khi phát hành.</p><button type="button" onClick={load} disabled={loading||!token.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#15A651] py-3 font-semibold text-white disabled:opacity-50"><RefreshCw size={18}/>{loading?'Đang xử lý...':'Tải đơn hàng'}</button></section>
  <div className="mt-4 grid grid-cols-2 bg-white text-sm font-semibold"><button onClick={()=>setSelected('assigned')} className={`p-4 ${selected==='assigned'?'border-b-2 border-green-600 text-green-700':'text-gray-500'}`}>Chờ lấy ({items.filter(x=>x.status==='assigned').length})</button><button onClick={()=>setSelected('in_progress')} className={`p-4 ${selected==='in_progress'?'border-b-2 border-green-600 text-green-700':'text-gray-500'}`}>Đang giao ({items.filter(x=>x.status==='picked_up'||x.status==='delivering').length})</button></div>
  {error&&<p role="alert" className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  <section aria-label="Danh sách đơn" className="space-y-4 p-4">{visible.length===0?<div className="rounded-xl bg-white p-6 text-center text-gray-600">Chưa có đơn trong trạng thái này. Kết nối API để xem dữ liệu thực.</div>:visible.map(item=><article key={item.order_id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-bold text-gray-900">Đơn {item.order_id}</h2><span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{({assigned:'Chờ lấy',picked_up:'Đã lấy',delivering:'Đang giao',delivered:'Đã giao'} as const)[item.status]}</span></div><p className="mt-3 font-medium text-gray-800">{item.customer_name}</p><p className="mt-2 flex gap-2 text-sm text-gray-600"><MapPin size={18} className="shrink-0"/>{item.delivery_address}</p><p className="mt-3 text-sm text-gray-600">Giá trị đơn: <strong>{item.total_amount.toLocaleString('vi-VN')} ₫</strong></p>{item.status!=='delivered'&&<button disabled={loading} onClick={()=>advance(item)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#15A651] px-4 py-3 font-semibold text-white disabled:opacity-50"><PackageCheck size={18}/>{item.status==='assigned'?'Xác nhận đã lấy':item.status==='picked_up'?'Bắt đầu giao':'Xác nhận giao thành công'}</button>}</article>)}</section><NavigationBar/></div></main>;
}
