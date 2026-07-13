import { useState, useEffect } from 'react'
import { Calendar, Clock, Navigation, Heart, MessageCircle, Zap } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function FeedItem({ act, onClick, formatDuration }) {
  const { user } = useAuth()
  const [likes, setLikes] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  
  // Ambil data Kudos & Comments (Ringkasan)
  useEffect(() => {
    const fetchSocialData = async () => {
      // 1. Ambil jumlah Kudos
      const { count: kudosCount, error: kError } = await supabase
        .from('kudos')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', act.id)

      if (!kError) setLikes(kudosCount || 0)

      // 2. Cek apakah user saat ini sudah memberi kudos
      if (user) {
        const { data: userKudo } = await supabase
          .from('kudos')
          .select('id')
          .eq('activity_id', act.id)
          .eq('user_id', user.id)
          .single()
        
        if (userKudo) setHasLiked(true)
      }

      // 3. Ambil jumlah komentar
      const { count: commCount, error: cError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', act.id)
        
      if (!cError) setCommentsCount(commCount || 0)
    }

    fetchSocialData()
  }, [act.id, user])

  const toggleKudos = async (e) => {
    e.stopPropagation() // Mencegah klik masuk ke Detail Modal
    if (!user) return

    if (hasLiked) {
      // Batal Like
      await supabase.from('kudos').delete().eq('activity_id', act.id).eq('user_id', user.id)
      setLikes(p => p - 1)
      setHasLiked(false)
    } else {
      // Like
      const { error } = await supabase.from('kudos').insert([{ 
        activity_id: act.id, 
        user_id: user.id,
        user_full_name: user?.user_metadata?.full_name || 'Pengguna Strava Clone'
      }])
      
      if (error) {
        alert('Gagal menyukai postingan. Pastikan Anda sudah menjalankan SQL terbaru di Supabase!\nError: ' + error.message)
        return
      }
      
      setLikes(p => p + 1)
      setHasLiked(true)
    }
  }

  const calculatePace = (seconds, distance) => {
    if (!distance || distance === 0) return "0:00"
    const secsPerKm = seconds / distance
    const m = Math.floor(secsPerKm / 60)
    const s = Math.floor(secsPerKm % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div 
      onClick={onClick}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md cursor-pointer hover:border-orange-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10">
            {act.activity_type === 'run' ? '🏃 Lari' : '🚴 Sepeda'}
          </span>
          <h4 className="mt-2 text-lg font-bold text-gray-900">{act.title}</h4>
          
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{act.user_full_name || 'Pengguna Strava Clone'}</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(act.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-b border-gray-100 py-4 text-center">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase flex justify-center items-center gap-1"><Navigation size={12} /> Jarak</p>
          <p className="mt-1 text-lg font-black text-gray-800">{act.distance} <span className="text-xs font-normal text-gray-500">km</span></p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase flex justify-center items-center gap-1"><Zap size={12} /> Pace</p>
          <p className="mt-1 text-lg font-black text-gray-800">{calculatePace(act.duration, act.distance)} <span className="text-xs font-normal text-gray-500">/km</span></p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase flex justify-center items-center gap-1"><Clock size={12} /> Waktu</p>
          <p className="mt-1 text-lg font-black text-gray-800">{formatDuration(act.duration)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase flex justify-center items-center gap-1">📈 Elevasi</p>
          <p className="mt-1 text-lg font-black text-gray-800">{act.elevation_gain} <span className="text-xs font-normal text-gray-500">m</span></p>
        </div>
      </div>
      
      {/* Social Actions */}
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <button 
          onClick={toggleKudos}
          className={`flex items-center gap-1.5 font-medium transition cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md -ml-2
            ${hasLiked ? 'text-orange-600' : 'hover:text-orange-600'}`}
        >
          <Heart size={18} className={hasLiked ? 'fill-orange-600' : ''} />
          {likes > 0 && <span>{likes}</span>}
        </button>
        <div className="flex items-center gap-1.5 font-medium">
          <MessageCircle size={18} />
          {commentsCount > 0 && <span>{commentsCount}</span>}
        </div>
      </div>
    </div>
  )
}
