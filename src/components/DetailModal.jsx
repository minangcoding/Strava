import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { X, Calendar, Clock, Navigation, Send, Share2 } from 'lucide-react'
import ActivityMap from './ActivityMap'
import PerformanceChart from './PerformanceChart'
import StoryGenerator from './StoryGenerator'
import { toBlob, toPng } from 'html-to-image'

export default function DetailModal({ isOpen, onClose, activity }) {
  const { user } = useAuth()
  const modalRef = useRef(null)
  const [isSharing, setIsSharing] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState(null)
  const [isStoryOpen, setIsStoryOpen] = useState(false)

  useEffect(() => {
    if (isOpen && activity) {
      const fetchRoute = async () => {
        try {
          setLoading(true)
          const { data, error } = await supabase
            .from('activity_routes')
            .select('coordinates')
            .eq('activity_id', activity.id)
            .single()

          if (error) throw error
          setRouteCoordinates(data?.coordinates || [])
        } catch (error) {
          console.error('Gagal memuat rute:', error.message)
        } finally {
          setLoading(false)
        }
      }
      
      const fetchComments = async () => {
        setLoadingComments(true)
        setCommentsError(null)
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('activity_id', activity.id)
          .order('created_at', { ascending: true })
        
        if (error) {
          setCommentsError(error.message)
        } else {
          setComments(data || [])
        }
        setLoadingComments(false)
      }

      fetchRoute()
      fetchComments()
    }
  }, [isOpen, activity])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ 
          activity_id: activity.id, 
          user_id: user.id, 
          content: newComment,
          user_full_name: user?.user_metadata?.full_name || 'Pengguna Strava Clone'
        }])
        .select()

      if (error) throw error
      setComments([...comments, data[0]])
      setNewComment('')
    } catch (error) {
      alert('Gagal mengirim komentar: ' + error.message)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs} mnt`
  }

  const calculatePace = (seconds, distance) => {
    if (!distance || distance === 0) return "0:00"
    const secsPerKm = seconds / distance
    const m = Math.floor(secsPerKm / 60)
    const s = Math.floor(secsPerKm % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleShare = async () => {
    if (!modalRef.current) return
    setIsSharing(true)
    
    const shareText = `🏃 ${activity.title}\n📏 Jarak: ${activity.distance} km\n⚡ Pace: ${calculatePace(activity.duration, activity.distance)} /km\n⏱ Waktu: ${formatDuration(activity.duration)}\n📈 Elevasi: ${activity.elevation_gain} m\n\nDirekam via Strava Klon 💪`
    
    try {
      // Tunggu sebentar agar tombol 'Share' disembunyikan dari DOM sebelum screenshot
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Menggunakan html-to-image yang lebih stabil untuk CSS modern (Tailwind v4 oklch)
      const blob = await toBlob(modalRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      const file = new File([blob], `Strava-${activity.title}.png`, { type: 'image/png' })
      
      // Cek apakah browser HP support kirim file gambar langsung
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: activity.title,
            text: shareText,
            files: [file]
          })
        } catch (err) {
          console.log('Batal membagikan')
        }
      } else {
        // Fallback untuk browser Laptop/PC: Langsung download gambarnya
        const dataUrl = await toPng(modalRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
        const link = document.createElement('a')
        link.download = `Strava-${activity.title}.png`
        link.href = dataUrl
        link.click()
        
        navigator.clipboard.writeText(shareText)
        alert('Peta dan Statistik berhasil didownload sebagai Gambar!\n\nTeks juga telah disalin ke clipboard, siap di-paste ke Instagram/WhatsApp.')
      }
      setIsSharing(false)
    } catch (err) {
      alert('Gagal membuat gambar: ' + err.message)
      setIsSharing(false)
    }
  }

  if (!isOpen || !activity) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-white rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10">
                {activity.activity_type === 'run' ? '🏃 Lari' : '🚴 Sepeda'}
              </span>
              <h3 className="text-xl font-bold mt-1">{activity.title}</h3>
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Calendar size={12} />
                {new Date(activity.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isSharing ? (
                <>
                  <button onClick={() => setIsStoryOpen(true)} className="text-white bg-gradient-to-r from-fuchsia-600 to-orange-500 hover:from-fuchsia-500 hover:to-orange-400 cursor-pointer px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1" title="Buat Story IG/WA">
                    Buat Story 📸
                  </button>
                  <button onClick={handleShare} className="text-gray-500 hover:text-orange-600 cursor-pointer p-2 rounded-full hover:bg-orange-50 transition-colors" title="Bagikan ke Sosmed">
                    <Share2 size={20} />
                  </button>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded-full hover:bg-gray-50 transition-colors">
                    <X size={20} />
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-orange-600 animate-pulse bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                  📸 Menyimpan...
                </span>
              )}
            </div>
          </div>

        {/* Konten Utama */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">Memuat detail rute...</div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Grid Peta & Angka Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2" ref={modalRef}>
                <ActivityMap positions={routeCoordinates} />
              </div>
              
              {/* Box Statistik Ringkas */}
              <div className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block font-medium">Jarak Total</span>
                    <span className="text-2xl font-black text-gray-950">{activity.distance} <span className="text-sm font-normal text-gray-500">km</span></span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-xs text-gray-500 block font-medium">Pace Rata-rata</span>
                    <span className="text-2xl font-black text-gray-950">{calculatePace(activity.duration, activity.distance)} <span className="text-sm font-normal text-gray-500">/km</span></span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-xs text-gray-500 block font-medium">Waktu Tempuh</span>
                    <span className="text-2xl font-black text-gray-950">{formatDuration(activity.duration)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-xs text-gray-500 block font-medium">Elevasi Diperoleh</span>
                    <span className="text-2xl font-black text-gray-950">{activity.elevation_gain} <span className="text-sm font-normal text-gray-500">m</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Komponen Grafik Recharts */}
            {routeCoordinates.length > 0 && (
              <PerformanceChart coordinates={routeCoordinates} />
            )}
            
            {/* Seksi Komentar */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h4 className="text-lg font-bold mb-4">Komentar</h4>
              
              <div className="space-y-4 mb-4 max-h-48 overflow-y-auto pr-2">
                {loadingComments ? (
                  <p className="text-sm text-gray-500">Memuat komentar...</p>
                ) : commentsError ? (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs font-bold text-red-700">Gagal memuat komentar:</p>
                    <p className="text-xs text-red-600 font-mono mt-1">{commentsError}</p>
                    <p className="text-[10px] text-red-500 mt-2">Mohon screenshot pesan error ini.</p>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada komentar. Jadilah yang pertama!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs font-bold text-gray-700">{c.user_full_name || 'Pengguna Anonim'}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{c.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(c.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Form Komentar */}
              <form onSubmit={handlePostComment} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Tulis komentar..." 
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()} className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up khusus pembuat Story */}
      {isStoryOpen && (
        <StoryGenerator 
          isOpen={isStoryOpen} 
          onClose={() => setIsStoryOpen(false)} 
          activity={activity} 
          routeCoordinates={routeCoordinates}
          calculatePace={calculatePace}
          formatDuration={formatDuration}
        />
      )}
    </div>
  )
}