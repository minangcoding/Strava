// src/components/RecordModal.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { X, Play, Square } from 'lucide-react'
import ActivityMap from './ActivityMap'

export default function RecordModal({ isOpen, onClose, onRefresh }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('run')
  const [distance, setDistance] = useState(0) // km asli
  const [duration, setDuration] = useState(0) // detik asli
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [coordinates, setCoordinates] = useState([])
  const [loading, setLoading] = useState(false)

  const timerRef = useRef(null)
  const watchRef = useRef(null)
  const isPausedRef = useRef(false)

  // 1. Fungsi Menghitung Jarak antara 2 Titik Koordinat (Haversine Formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Jari-jari bumi dalam km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 2. Efek untuk menghitung timer durasi saat merekam
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording, isPaused])

  // 3. Fungsi Mulai Merekam Lokasi GPS Asli Perangkat
  const startRecording = () => {
    if (!navigator.geolocation) {
      alert('Browser kamu tidak mendukung pelacakan GPS.')
      return
    }

    setIsRecording(true)
    setIsPaused(false)
    isPausedRef.current = false
    setCoordinates([])
    setDistance(0)
    setDuration(0)

    // Mulai memperhatikan perubahan posisi user secara real-time
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (isPausedRef.current) return; // Jangan catat jika di-pause
        const { latitude, longitude } = position.coords
        const newCoord = [latitude, longitude]

        setCoordinates((prevCoords) => {
          if (prevCoords.length > 0) {
            const lastCoord = prevCoords[prevCoords.length - 1]
            // Hitung tambahan jarak dari titik terakhir
            const addedDist = calculateDistance(lastCoord[0], lastCoord[1], latitude, longitude)
            setDistance((prevDist) => parseFloat((prevDist + addedDist).toFixed(2)))
          }
          return [...prevCoords, newCoord]
        })
      },
      (error) => {
        console.error('Error GPS:', error.message)
        alert('Sinyal GPS Lemah atau Ditolak: ' + error.message)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // 4. Fungsi Berhenti Merekam & Pause
  const stopRecording = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
    }
    setIsRecording(false)
    setIsPaused(false)
  }

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current
    setIsPaused(isPausedRef.current)
  }

  // 5. Simpan Data Asli Ke Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (coordinates.length < 2) {
      alert('Rute terlalu pendek! Silakan bergerak sedikit agar GPS menangkap koordinat rute kamu.')
      return
    }
    setLoading(true)

    try {
      const { data: activityData, error: actError } = await supabase
        .from('activities')
        .insert([
          {
            user_id: user.id,
            user_full_name: user?.user_metadata?.full_name || 'Pengguna Strava Clone',
            title: title || `Aktivitas ${type === 'run' ? 'Lari' : 'Sepeda'}`,
            activity_type: type,
            distance: distance,
            duration: duration,
            elevation_gain: 0, // Untuk elevasi asli butuh API maps tambahan, kita set 0 dulu
            start_time: new Date().toISOString()
          }
        ])
        .select()

      if (actError) throw actError

      const { error: routeError } = await supabase
        .from('activity_routes')
        .insert([
          {
            activity_id: activityData[0].id,
            coordinates: coordinates // Koordinat asli yang direkam
          }
        ])

      if (routeError) throw routeError

      alert('Aktivitas asli kamu berhasil disimpan!')
      onRefresh()
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Bersihkan tracker jika modal ditutup tiba-tiba
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold">Rekam Aktivitas Real-Time</h3>
          <button onClick={onClose} disabled={isRecording} className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Kolom Kontrol Form */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Judul Aktivitas</label>
                <input
                  type="text" disabled={isRecording} placeholder="Lari Sore Keliling Komplek"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none disabled:bg-gray-50"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Jenis Olahraga</label>
                <select
                  disabled={isRecording}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none disabled:bg-gray-50"
                  value={type} onChange={(e) => setType(e.target.value)}
                >
                  <option value="run">🏃 Lari</option>
                  <option value="ride">🚴 Sepeda</option>
                </select>
              </div>

              {/* Tampilan Live Data Sensor */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Jarak Real</span>
                  <p className="text-xl font-black text-gray-800">{distance} km</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Waktu Real</span>
                  <p className="text-xl font-black text-gray-800">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Kontrol GPS */}
            <div className="space-y-2">
              {!isRecording ? (
                <button
                  type="button" onClick={startRecording}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-green-500 cursor-pointer"
                >
                  <Play size={16} /> Mulai Track GPS Asli
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button" onClick={togglePause}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-md cursor-pointer ${isPaused ? 'bg-blue-600 hover:bg-blue-500' : 'bg-yellow-500 hover:bg-yellow-400'}`}
                  >
                    <Play size={16} /> {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button" onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-500 cursor-pointer animate-pulse"
                  >
                    <Square size={16} /> Berhenti & Kunci
                  </button>
                </div>
              )}

              {!isRecording && coordinates.length > 0 && (
                <button
                  type="button" onClick={handleSubmit} disabled={loading}
                  className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-500 disabled:bg-gray-400 cursor-pointer"
                >
                  {loading ? 'Menyimpan Data Real...' : 'Simpan Hasil Olahraga'}
                </button>
              )}
            </div>
          </div>

          {/* Kolom Peta Pratinjau Live */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">Live GPS Map View:</label>
            <ActivityMap positions={coordinates} />
          </div>
        </div>
      </div>
    </div>
  )
}