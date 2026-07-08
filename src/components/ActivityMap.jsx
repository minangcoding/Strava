// src/components/ActivityMap.jsx
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

// Fix 100% ampuh untuk ikon marker Leaflet di Vercel
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Komponen mini untuk otomatis menyesuaikan zoom kamera agar seluruh rute terlihat
function RecenterMap({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [positions, map])
  return null
}

export default function ActivityMap({ positions }) {
  // Koordinat default (Monas, Jakarta) jika belum ada rute
  const defaultCenter = [-6.1754, 106.8272]
  const hasRoute = positions && positions.length > 0
  const center = hasRoute ? positions[0] : defaultCenter

  // Custom icon ala Strava (Hijau untuk Start, Hitam untuk Finish)
  const startIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })

  const endIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="w-4 h-4 bg-black rounded-full border-2 border-white shadow-md"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-200 shadow-inner z-0">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasRoute && (
          <>
            <Polyline positions={positions} color="rgb(234, 88, 12)" weight={4} />
            <Marker position={positions[0]} icon={startIcon} />
            {positions.length > 1 && (
              <Marker position={positions[positions.length - 1]} icon={endIcon} />
            )}
            <RecenterMap positions={positions} />
          </>
        )}
      </MapContainer>
    </div>
  )
}