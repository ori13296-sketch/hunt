import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Stop } from '../types';
import type { GeoPosition } from '../hooks/useGeolocation';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const playerIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.8)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

const stopIcon = (idx: number, isActive: boolean, isCompleted: boolean) =>
  L.divIcon({
    html: `<div style="
      width:32px;height:32px;
      background:${isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#6b7280'};
      border:3px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:bold;font-size:14px;
      box-shadow:0 2px 8px rgba(0,0,0,0.3)
    ">${idx + 1}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: '',
  });

const finalIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;background:#ef4444;
    border:3px solid white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3)
  ">🏁</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  stops: Stop[];
  playerPos?: GeoPosition | null;
  currentStopIndex?: number;
  onMapClick?: (lat: number, lng: number) => void;
  adminMode?: boolean;
  onStopClick?: (idx: number) => void;
}

export default function MapView({
  stops, playerPos, currentStopIndex = 0,
  onMapClick, adminMode = false, onStopClick,
}: Props) {
  const center: [number, number] = playerPos
    ? [playerPos.lat, playerPos.lng]
    : stops.length > 0
    ? [stops[0].lat, stops[0].lng]
    : [32.0853, 34.7818];

  const polyline = stops.map(s => [s.lat, s.lng] as [number, number]);

  return (
    <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {polyline.length > 1 && (
        <Polyline
          positions={polyline}
          pathOptions={{ color: '#6366f1', weight: 3, dashArray: '8,6', opacity: 0.7 }}
        />
      )}

      {stops.map((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const isCompleted = idx < currentStopIndex;
        const isFinal = idx === stops.length - 1;
        const showInPlayer = adminMode || idx <= currentStopIndex;

        if (!showInPlayer) return null;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={isFinal && !adminMode ? finalIcon : stopIcon(idx, isActive, isCompleted)}
            eventHandlers={{ click: () => onStopClick?.(idx) }}
          >
            <Popup>
              <div className="text-right" dir="rtl">
                <strong>{stop.name || `תחנה ${idx + 1}`}</strong>
                {(adminMode || isCompleted) && (
                  <p className="text-sm text-gray-600 mt-1">{stop.clue}</p>
                )}
              </div>
            </Popup>
            {isActive && !adminMode && (
              <Circle
                center={[stop.lat, stop.lng]}
                radius={stop.radius}
                pathOptions={{ color: '#f59e0b', fillColor: '#fde68a', fillOpacity: 0.25, weight: 2 }}
              />
            )}
          </Marker>
        );
      })}

      {playerPos && (
        <Marker position={[playerPos.lat, playerPos.lng]} icon={playerIcon}>
          <Popup>אתה כאן</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
