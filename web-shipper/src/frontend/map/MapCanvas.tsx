'use client';

import {useEffect, useMemo} from 'react';
import {MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, CircleMarker} from 'react-leaflet';
import {divIcon, latLngBounds, type LatLngExpression} from 'leaflet';
import type {GeoPoint} from '../../lib/map-helpers.mjs';

const hcm: LatLngExpression = [10.8231, 106.6297];
function icon(symbol: string, style: string) {
  // Fixed symbols, never interpolated from database/user-controlled input.
  return divIcon({
    className:'gp-map-marker',
    html:`<div class="gp-map-marker-inner ${style}">${symbol}</div>`,
    iconSize:[38,42],iconAnchor:[19,40],popupAnchor:[0,-36],
  });
}
const storeIcon=icon('🏪','gp-map-store');
const destinationIcon=icon('📍','gp-map-destination');
function MapClick({kind,onPick}:{kind:'pickup'|'dropoff'|null;onPick:(p:GeoPoint)=>void}) {
  useMapEvents({click(e){if(kind)onPick({lat:e.latlng.lat,lng:e.latlng.lng});}});
  return null;
}
function FitBounds({pickup,dropoff}:{pickup:GeoPoint|null;dropoff:GeoPoint|null}) {
  const map=useMap();
  const locations=useMemo(()=>[pickup,dropoff].filter((p):p is GeoPoint=>p!==null),[pickup,dropoff]);
  useEffect(()=>{
    if(locations.length===2)map.fitBounds(latLngBounds(locations.map(p=>[p.lat,p.lng] as [number,number])),{padding:[35,35],maxZoom:15});
    else if(locations.length===1)map.setView([locations[0].lat,locations[0].lng],14);
  },[map,locations]);
  return null;
}
export default function MapCanvas({pickup,dropoff,gps,picking,onPick,road}:{
  pickup:GeoPoint|null; dropoff:GeoPoint|null; gps:GeoPoint|null;
  picking:'pickup'|'dropoff'|null;onPick:(p:GeoPoint)=>void;road:GeoPoint[]|null;
}) {
  const center:LatLngExpression=pickup?[pickup.lat,pickup.lng]:gps?[gps.lat,gps.lng]:hcm;
  return <MapContainer center={center} zoom={pickup||gps?13:11} scrollWheelZoom={false}
    className={`h-[330px] w-full rounded-2xl sm:h-[380px] ${picking?'cursor-crosshair':''}`}
    zoomControl={true}>
    <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'/>
    <MapClick kind={picking} onPick={onPick}/>
    <FitBounds pickup={pickup} dropoff={dropoff}/>
    {pickup&&<Marker position={[pickup.lat,pickup.lng]} icon={storeIcon}><Popup>Điểm lấy hàng</Popup></Marker>}
    {dropoff&&<Marker position={[dropoff.lat,dropoff.lng]} icon={destinationIcon}><Popup>Điểm giao hàng (ghim tạm)</Popup></Marker>}
    {gps&&<CircleMarker center={[gps.lat,gps.lng]} radius={10} pathOptions={{color:'#155e75',weight:3,fillColor:'#22d3ee',fillOpacity:0.8}}><Popup>Vị trí hiện tại của bạn</Popup></CircleMarker>}
    {road&&road.length>1?<Polyline positions={road.map(p=>[p.lat,p.lng] as [number,number])} pathOptions={{color:'#047857',weight:6,opacity:0.85}} />
      :pickup&&dropoff?<Polyline positions={[[pickup.lat,pickup.lng],[dropoff.lat,dropoff.lng]]} pathOptions={{color:'#f59e0b',dashArray:'9 9',weight:4}} />:null}
  </MapContainer>;
}
