'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import {Crosshair, MapPin, RotateCcw, Route, LoaderCircle, LocateFixed, Info, MapPinned, Store} from 'lucide-react';
import Modal from '../shared/Modal';
import {validPoint, googleMapsNavigationUrl, type GeoPoint} from '../../lib/map-helpers.mjs';

const MapCanvas = dynamic(() => import('./MapCanvas'), {ssr: false, loading: () =>
  <div className="flex h-[330px] items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">Đang mở bản đồ…</div>});

type MapDetails = {
  orderId: string;
  pickup: GeoPoint | null;
  dropoff: GeoPoint | null;
  storeName: string;
  storeAddress: string;
  deliveryAddress: string;
};
type Road = {points: GeoPoint[]; distanceMeters: number; durationSeconds: number};

export default function DeliveryMapPanel({orderId, onClose}: {orderId: string; onClose: () => void}) {
  const [details, setDetails] = useState<MapDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(null);
  const [temporaryPickup, setTemporaryPickup] = useState(false);
  const [temporaryDropoff, setTemporaryDropoff] = useState(false);
  const [picking, setPicking] = useState<'pickup' | 'dropoff' | null>(null);
  const [gps, setGps] = useState<GeoPoint | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [road, setRoad] = useState<Road | null>(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState<'gps' | 'store'>('store');
  const watchRef = useRef<number | null>(null);
  const canTryRoad = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDetails(null);
    setError('');
    setRoad(null);
    setTemporaryPickup(false);
    setTemporaryDropoff(false);
    async function load() {
      try {
        const response = await fetch(`/api/shipper/deliveries/${encodeURIComponent(orderId)}/map`,
          {cache: 'no-store', signal: controller.signal});
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Không tải được thông tin vị trí');
        if (!controller.signal.aborted) {
          setDetails(body);
          setPickup(validPoint(body.pickup) ? body.pickup : null);
          setDropoff(validPoint(body.dropoff) ? body.dropoff : null);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được bản đồ');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [orderId]);

  const stopGps = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setGpsActive(false);
  }, []);
  useEffect(() => () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
  }, []);
  function toggleGps() {
    if (watchRef.current !== null) { stopGps(); return; }
    if (!navigator.geolocation) { setError('Thiết bị/trình duyệt không hỗ trợ định vị GPS.'); return; }
    setError('');
    watchRef.current = navigator.geolocation.watchPosition(
      p => {setGps({lat: p.coords.latitude, lng: p.coords.longitude}); setGpsActive(true);},
      err => {setError(err.code === 1 ? 'Bạn chưa cấp quyền GPS.' : 'Không lấy được GPS. Hãy kiểm tra vị trí và kết nối.'); stopGps();},
      {enableHighAccuracy: true, timeout: 16000, maximumAge: 8000},
    );
    setGpsActive(true);
  }
  function pick(point: GeoPoint) {
    if (!validPoint(point)) return;
    if (picking === 'pickup') {setPickup(point); setTemporaryPickup(true);}
    if (picking === 'dropoff') {setDropoff(point); setTemporaryDropoff(true);}
    setPicking(null);
    setRoad(null);
    setError('');
  }
  function resetPins() {
    setPickup(details && validPoint(details.pickup) ? details.pickup : null);
    setDropoff(details && validPoint(details.dropoff) ? details.dropoff : null);
    setTemporaryPickup(false);
    setTemporaryDropoff(false);
    setRoad(null);
    setError('');
  }
  async function tryDemoRoute() {
    const start = gps ?? pickup;
    if (!start || !dropoff || routeBusy) return;
    setRouteBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/shipper/deliveries/${encodeURIComponent(orderId)}/demo-route`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({start, end: dropoff}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không tìm được tuyến đường');
      if (!Array.isArray(data.points) || !data.points.every(validPoint) || data.points.length < 2)
        throw new Error('Tuyến đường nhận về không hợp lệ');
      setRoad(data);
      setRouteOrigin(gps ? 'gps' : 'store');
    } catch (e) {
      setRoad(null);
      setError(e instanceof Error ? e.message : 'Không định tuyến được');
    } finally {
      setRouteBusy(false);
    }
  }
  return <Modal title="Bản đồ giao hàng" description={`Đơn #${orderId.slice(0, 8)} · OpenStreetMap`} icon={MapPinned} onClose={onClose} wide>
    {loading ? <div className="flex min-h-52 items-center justify-center gap-2 text-emerald-700"><LoaderCircle className="animate-spin"/>Đang tải vị trí…</div> :
      !details ? <div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error || 'Không có dữ liệu bản đồ'}</div> : <>
        <div className="mb-4 space-y-2 rounded-2xl border border-emerald-100 bg-[#f7fbf8] p-4 text-sm text-slate-700">
          <p className="flex items-start gap-2"><Store size={17} className="mt-0.5 shrink-0 text-emerald-700"/><span><strong>Lấy hàng:</strong> {details.storeName}{details.storeAddress ? ` — ${details.storeAddress}` : ''}</span></p>
          <p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0 text-emerald-700"/><span><strong>Giao tới:</strong> {details.deliveryAddress || 'Chưa có địa chỉ giao hàng'}</span></p>
        </div>
        {!details.dropoff && !temporaryDropoff && <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Đơn hàng chưa lưu tọa độ điểm giao. Bản đồ không tự đoán địa chỉ từ văn bản. Bạn có thể ghim điểm tạm để thử tuyến, nhưng cần xác minh vị trí thực tế với khách hàng.
        </p>}
        {!pickup && <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Cửa hàng chưa có tọa độ chính xác. Hãy kiểm tra lại thông tin cửa hàng hoặc chọn điểm lấy tạm.
        </p>}
        {!pickup && !dropoff && !gps && <p className="mb-3 text-xs text-slate-500">
          Bản đồ đang mở ở khung nhìn mặc định TP.HCM, không phải vị trí của đơn hàng. Hãy bật GPS hoặc di chuyển bản đồ để chọn ghim.
        </p>}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100">
          <MapCanvas pickup={pickup} dropoff={dropoff} gps={gps} picking={picking} onPick={pick}
            road={road?.points ?? null} temporaryPickup={temporaryPickup} temporaryDropoff={temporaryDropoff}/>
          {picking && <div className="pointer-events-none absolute left-3 top-3 z-[401] rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow">
            Chạm vị trí {picking === 'pickup' ? 'lấy hàng' : 'giao hàng'} trên bản đồ (chỉ ghim tạm)
          </div>}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => {setPicking('dropoff');setError('');}} aria-pressed={picking === 'dropoff'}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${picking === 'dropoff' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-slate-200 text-slate-700'}`}><MapPin size={17}/>Ghim điểm giao</button>
          <button type="button" onClick={() => {setPicking('pickup');setError('');}} aria-pressed={picking === 'pickup'}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${picking === 'pickup' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-slate-200 text-slate-700'}`}><Crosshair size={17}/>Sửa điểm lấy</button>
          <button type="button" onClick={toggleGps}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700"><LocateFixed size={17}/>{gpsActive ? 'Tắt GPS' : 'Bật GPS'}</button>
        </div>
        {picking && <button type="button" className="mt-2 text-sm text-slate-600 underline" onClick={() => setPicking(null)}>Hủy chọn vị trí</button>}
        {(temporaryPickup || temporaryDropoff) && <button type="button" className="mt-2 ml-3 text-sm text-slate-600 underline" onClick={resetPins}>Khôi phục tọa độ của đơn hàng</button>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          {road ? <p><strong>Tuyến đường bộ OSRM thử nghiệm ({routeOrigin === 'gps' ? 'từ GPS' : 'từ cửa hàng'}):</strong> {(road.distanceMeters / 1000).toFixed(1)} km · Khoảng {Math.round(road.durationSeconds / 60)} phút. Chỉ tham khảo, chưa phải điều hướng thực tế.</p>
            : <p><strong>Chưa tính tuyến đường.</strong> Chỉ hiển thị các vị trí có tọa độ; không vẽ đường chim bay giả làm đường đi.</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canTryRoad && <button type="button" disabled={!(gps || pickup) || !dropoff || routeBusy} onClick={() => void tryDemoRoute()}
            className="gp-primary-button disabled:opacity-50">{routeBusy ? <LoaderCircle size={16} className="animate-spin"/> : <Route size={16}/>}
            Thử tuyến đường bộ OSRM {gps ? '(từ GPS)' : '(từ cửa hàng)'}
          </button>}
          {dropoff && <a href={googleMapsNavigationUrl(dropoff) ?? '#'} target="_blank" rel="noopener noreferrer"
            className="gp-secondary-button" title="Mở hướng dẫn đường đi bằng Google Maps trên thiết bị">
            <MapPinned size={16}/>Mở dẫn đường thực tế (Google Maps)
          </a>}
          {road && <button type="button" onClick={() => setRoad(null)} className="gp-secondary-button"><RotateCcw size={15}/>Ẩn tuyến</button>}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0"/>
          Nền OpenStreetMap là bản đồ đường phố, không phải ảnh vệ tinh. Ghim thủ công không thay đổi đơn hàng. OSRM công cộng chỉ dùng khi phát triển, gửi hai tọa độ lên dịch vụ ngoài; kết quả có thể lệch đường cấm, hẻm hoặc giao thông thực tế. Nút Google Maps mở ứng dụng ngoài và chia sẻ tọa độ đích với Google khi bạn nhấn; hãy kiểm tra ghim trước khi đi. Không dùng OSRM demo để tính phí hay dẫn đường giao hàng thật.
        </p>
      </>}
  </Modal>;
}
