'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import {Crosshair, MapPin, RotateCcw, Route, X, LoaderCircle, LocateFixed, Info} from 'lucide-react';
import {haversineKm, validPoint, type GeoPoint} from '../../lib/map-helpers.mjs';

const MapCanvas=dynamic(()=>import('./MapCanvas'),{ssr:false,loading:()=>
  <div className="flex h-[330px] items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">Đang mở bản đồ…</div>});
type MapDetails={orderId:string;pickup:GeoPoint|null;storeName:string;storeAddress:string;deliveryAddress:string};
type Road={points:GeoPoint[];distanceMeters:number;durationSeconds:number};
export default function DeliveryMapPanel({orderId,onClose}:{orderId:string;onClose:()=>void}) {
  const [details,setDetails]=useState<MapDetails|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [pickup,setPickup]=useState<GeoPoint|null>(null);
  const [dropoff,setDropoff]=useState<GeoPoint|null>(null);
  const [picking,setPicking]=useState<'pickup'|'dropoff'|null>(null);
  const [gps,setGps]=useState<GeoPoint|null>(null);
  const [gpsActive,setGpsActive]=useState(false);
  const [road,setRoad]=useState<Road|null>(null);
  const [routeBusy,setRouteBusy]=useState(false);
  const watchRef=useRef<number|null>(null);
  const canTryRoad=process.env.NODE_ENV === 'development';

  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      try{
        const response=await fetch(`/api/shipper/deliveries/${encodeURIComponent(orderId)}/map`,
          {cache:'no-store',signal:controller.signal});
        const body=await response.json();
        if (!response.ok)throw new Error(body.error||'Không tải được thông tin vị trí');
        if(!controller.signal.aborted){
          setDetails(body);setPickup(validPoint(body.pickup)?body.pickup:null);
        }
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được bản đồ');}
      finally{if(!controller.signal.aborted)setLoading(false);}
    }
    void load();return()=>controller.abort();
  },[orderId]);

  const stopGps=useCallback(()=>{
    if(watchRef.current!==null&&typeof navigator!=='undefined'&&navigator.geolocation){
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current=null;
    }
    setGpsActive(false);
  },[]);
  useEffect(()=>()=>{
    if(watchRef.current!==null&&navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
  },[]);
  function toggleGps(){
    if(watchRef.current!==null){stopGps();return;}
    if(!navigator.geolocation){setError('Thiết bị/trình duyệt không hỗ trợ định vị GPS.');return;}
    setError('');
    watchRef.current=navigator.geolocation.watchPosition(
      p=>{setGps({lat:p.coords.latitude,lng:p.coords.longitude});setGpsActive(true);},
      err=>{setError(err.code===1?'Bạn chưa cho phép truy cập vị trí. Vẫn có thể ghim điểm thủ công.':'Không lấy được GPS. Hãy kiểm tra GPS và kết nối.');stopGps();},
      {enableHighAccuracy:true,timeout:16000,maximumAge:8000}
    );
    setGpsActive(true);
  }
  function pick(point:GeoPoint){
    if(!validPoint(point))return;
    if(picking==='pickup')setPickup(point);
    if(picking==='dropoff')setDropoff(point);
    setPicking(null);setRoad(null);setError('');
  }
  async function tryDemoRoute(){
    if(!pickup||!dropoff)return;
    setRouteBusy(true);setError('');
    try{
      const response=await fetch(`/api/shipper/deliveries/${encodeURIComponent(orderId)}/demo-route`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({start:pickup,end:dropoff}),
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Không tìm được tuyến đường');
      if(!Array.isArray(data.points)||!data.points.every(validPoint)||data.points.length<2)throw new Error('Tuyến đường không hợp lệ');
      setRoad(data);
    }catch(e){setRoad(null);setError(e instanceof Error?e.message:'Không định tuyến được');}
    finally{setRouteBusy(false);}
  }
  const straightKm=haversineKm(pickup,dropoff);
  return <div role="dialog" aria-modal="true" aria-label="Bản đồ giao hàng" className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-3 sm:p-6">
    <div className="mx-auto max-w-[680px] rounded-[26px] bg-white p-4 shadow-2xl sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div><h2 className="text-lg font-bold text-slate-900">Bản đồ giao hàng</h2><p className="text-xs text-slate-500">Đơn #{orderId.slice(0,8)} · OpenStreetMap</p></div>
        <button onClick={onClose} type="button" aria-label="Đóng bản đồ" className="rounded-xl bg-slate-100 p-2 text-slate-700"><X size={21}/></button>
      </div>
      {loading?<div className="flex min-h-52 items-center justify-center gap-2 text-emerald-700"><LoaderCircle className="animate-spin"/>Đang tải vị trí cửa hàng…</div>:
      !details?<div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error||'Không có dữ liệu bản đồ'}</div>:
      <>
        <div className="mb-3 space-y-1 text-sm text-slate-700"><p><strong>🏪 Lấy hàng:</strong> {details.storeName}{details.storeAddress?` — ${details.storeAddress}`:''}</p>
        <p><strong>📍 Giao tới:</strong> {details.deliveryAddress||'Chưa có địa chỉ giao hàng'}</p></div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100">
          <MapCanvas pickup={pickup} dropoff={dropoff} gps={gps} picking={picking} onPick={pick} road={road?.points??null}/>
          {picking&&<div className="pointer-events-none absolute left-3 top-3 z-[401] rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow">Chạm vị trí {picking==='pickup'?'lấy hàng':'giao hàng'} trên bản đồ</div>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={()=>{setPicking('dropoff');setError('');}} aria-pressed={picking==='dropoff'} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${picking==='dropoff'?'border-emerald-600 bg-emerald-100 text-emerald-800':'border-slate-200 text-slate-700'}`}><MapPin size={17}/>Ghim điểm giao</button>
          <button type="button" onClick={()=>{setPicking('pickup');setError('');}} aria-pressed={picking==='pickup'} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${picking==='pickup'?'border-emerald-600 bg-emerald-100 text-emerald-800':'border-slate-200 text-slate-700'}`}><Crosshair size={17}/>Sửa điểm lấy</button>
          <button type="button" onClick={toggleGps} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700"><LocateFixed size={17}/>{gpsActive?'Tắt GPS':'Bật GPS'}</button>
        </div>
        {picking&&<button type="button" className="mt-2 text-sm text-slate-600 underline" onClick={()=>setPicking(null)}>Hủy chọn vị trí</button>}
        {error&&<p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          {road?<p><strong>Tuyến demo:</strong> {(road.distanceMeters/1000).toFixed(1)} km · Khoảng {Math.round(road.durationSeconds/60)} phút (ước tính từ OSRM)</p>:
          straightKm!==null?<p><strong>Đường nét đứt:</strong> {straightKm.toFixed(1)} km đường chim bay. Không phải đường đi thực tế hay cơ sở tính phí ship.</p>:
          <p>Chọn điểm giao trên bản đồ để hiển thị đường nối minh họa. Nếu thiếu tọa độ cửa hàng, ghim thêm điểm lấy hàng.</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canTryRoad&&<button type="button" disabled={!pickup||!dropoff||routeBusy} onClick={()=>void tryDemoRoute()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{routeBusy?<LoaderCircle size={16} className="animate-spin"/>:<Route size={16}/>}Thử tuyến đường OSRM</button>}
          {road&&<button type="button" onClick={()=>setRoad(null)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold"><RotateCcw size={15}/>Trở về đường nối</button>}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0"/>Vị trí ghim chỉ lưu tạm trên màn hình, không ghi vào đơn hàng. Khi thử OSRM, tọa độ hai điểm được gửi tới máy chủ định tuyến công cộng. Chỉ dùng demo; không dùng để điều hướng thực tế hoặc tính phí giao hàng.</p>
      </>}
    </div>
  </div>;
}
