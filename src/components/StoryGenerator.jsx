import { useState, useRef } from 'react'
import { X, ImagePlus, Share2, Download } from 'lucide-react'
import { toPng } from 'html-to-image'

export default function StoryGenerator({ isOpen, onClose, activity, routeCoordinates, calculatePace, formatDuration }) {
  const [bgImage, setBgImage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const storyRef = useRef(null)

  if (!isOpen || !activity) return null

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBgImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Fungsi untuk menggambar rute ke SVG, mempertahankan aspect ratio aslinya
  const getSvgPoints = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return ""
    
    const lats = coordinates.map(c => c[0])
    const lngs = coordinates.map(c => c[1])
    
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    const latDiff = Math.max(maxLat - minLat, 0.00001)
    const lngDiff = Math.max(maxLng - minLng, 0.00001)
    
    // Kalkulasi bounding box ratio
    const ratio = lngDiff / latDiff
    
    let w = 100
    let h = 100
    let offsetX = 0
    let offsetY = 0
    
    if (ratio > 1) {
      h = 100 / ratio
      offsetY = (100 - h) / 2
    } else {
      w = 100 * ratio
      offsetX = (100 - w) / 2
    }
    
    const points = coordinates.map(c => {
      const x = ((c[1] - minLng) / lngDiff) * w + offsetX
      const y = (1 - ((c[0] - minLat) / latDiff)) * h + offsetY
      return `${x},${y}`
    }).join(" ")
    
    return points
  }

  const handleExport = async (action = 'share') => {
    if (!storyRef.current) return
    setIsExporting(true)

    try {
      // 9:16 resolusi optimal biasanya lebar 1080. Kita render dengan canvasStyle untuk memperbesar hasil akhir
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Kualitas sangat tinggi (1080x1920)
      })

      if (action === 'download') {
        const link = document.createElement('a')
        link.download = `Story-${activity.title.replace(/\s+/g, '-')}.png`
        link.href = dataUrl
        link.click()
        alert('Gambar Story berhasil diunduh!')
      } else {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `Story-${activity.title.replace(/\s+/g, '-')}.png`, { type: 'image/png' })
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Story Strava Klon',
            files: [file]
          })
        } else {
          // Fallback
          const link = document.createElement('a')
          link.download = `Story-${activity.title.replace(/\s+/g, '-')}.png`
          link.href = dataUrl
          link.click()
          alert('Perangkat tidak mendukung Share otomatis. Gambar telah diunduh.')
        }
      }
    } catch (err) {
      alert('Gagal membuat gambar: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl max-h-[90vh]">
        
        {/* Editor Settings (Kiri) */}
        <div className="w-full md:w-1/3 bg-gray-900 rounded-3xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-xl">Buat Story</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-300 font-medium mb-2 block">Pilih Background Foto</span>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer bg-gray-800 hover:bg-gray-700 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400"><span className="font-semibold">Klik untuk unggah</span></p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </label>
            <p className="text-xs text-gray-500 text-center">Rasio terbaik 9:16 (Mode Potrait)</p>
          </div>

          <div className="mt-auto space-y-3">
            <button 
              onClick={() => handleExport('share')} 
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-500 transition font-bold disabled:opacity-50 cursor-pointer"
            >
              <Share2 size={20} />
              {isExporting ? 'Memproses...' : 'Bagikan Story'}
            </button>
            <button 
              onClick={() => handleExport('download')} 
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white p-3 rounded-xl hover:bg-gray-700 transition font-bold disabled:opacity-50 cursor-pointer border border-gray-700"
            >
              <Download size={20} />
              Simpan ke Galeri
            </button>
          </div>
        </div>

        {/* Preview Canvas 9:16 (Kanan) */}
        <div className="w-full md:w-2/3 flex items-center justify-center bg-gray-950 rounded-3xl p-4 overflow-hidden relative">
          {/* Wrapper 9:16 aspect ratio */}
          <div 
            className="relative overflow-hidden shrink-0 shadow-2xl rounded-xl" 
            style={{ width: '360px', height: '640px', backgroundColor: '#111827' }} 
            ref={storyRef}
          >
            {/* Background Image / Overlay */}
            {bgImage ? (
              <>
                <img src={bgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            )}

            {/* Content: Stats */}
            <div className="absolute top-16 left-0 right-0 flex flex-col items-center text-white z-10 space-y-6 drop-shadow-md">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-1">Distance</p>
                <p className="text-6xl font-black">{activity.distance} <span className="text-2xl font-normal opacity-80">km</span></p>
              </div>

              <div className="flex gap-10 text-center w-full justify-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">Pace</p>
                  <p className="text-3xl font-black">{calculatePace(activity.duration, activity.distance)}<span className="text-sm font-normal opacity-80">/km</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">Time</p>
                  <p className="text-3xl font-black">{formatDuration(activity.duration).replace(' mnt', 'm')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">Elevation</p>
                  <p className="text-3xl font-black">{activity.elevation_gain}<span className="text-sm font-normal opacity-80">m</span></p>
                </div>
              </div>
            </div>

            {/* Content: SVG Route Polyline */}
            {routeCoordinates && routeCoordinates.length > 0 && (
              <div className="absolute bottom-24 left-10 right-10 top-[280px] z-10 pointer-events-none drop-shadow-[0_5px_15px_rgba(234,88,12,0.6)]">
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  <polyline 
                    points={getSvgPoints(routeCoordinates)} 
                    fill="none" 
                    stroke="#ea580c" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </div>
            )}

            {/* Footer Logo */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
              <h2 className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">STRAVA <span className="text-orange-500">KLON</span></h2>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
