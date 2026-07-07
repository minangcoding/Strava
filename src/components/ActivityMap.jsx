// src/components/ActivityMap.jsx
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

// Fix untuk masalah ikon marker Leaflet yang hilang saat di-deploy (Vite production)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Komponen mini untuk otomatis mengarahkan kamera peta ke tengah rute
function RecenterMap({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.setView(positions[0], 14)
    }
  }, [positions, map])
  return null
}

export default function ActivityMap({ positions }) {
  // Koordinat default (Monas, Jakarta) jika belum ada rute
  const defaultCenter = [-6.1754, 106.8272]
  const hasRoute = positions && positions.length > 0
  const center = hasRoute ? positions[0] : defaultCenter

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-200 shadow-inner">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasRoute && (
          <>
            <Polyline positions={positions} color="rgb(234, 88, 12)" weight={4} />
            <Marker position={positions[0]} />
            <Marker position={positions[positions.length - 1]} />
            <RecenterMap positions={positions} />
          </>
        )}
      </MapContainer>
    </div>
  )
}