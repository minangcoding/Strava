// src/pages/Dashboard.jsx (Modifikasi & Tambahkan bagian ini)
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { LogOut, Plus, Activity, Users, User, Download } from 'lucide-react'
import RecordModal from '../components/RecordModal'
import DetailModal from '../components/DetailModal' 
import FeedItem from '../components/FeedItem'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  // State untuk PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('global') 
  
  const fullName = user?.user_metadata?.full_name || 'Pelari Tangguh'

  const fetchActivities = async () => {
    try {
      setLoading(true)
      let query = supabase.from('activities').select('*').order('start_time', { ascending: false })
      
      if (activeTab === 'me') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setActivities(data)
    } catch (error) {
      console.error('Gagal mengambil data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) { fetchActivities() }
  }, [user, activeTab])

  const [isStandalone, setIsStandalone] = useState(false)

  // Menangkap event install PWA dari browser
  useEffect(() => {
    // Cek apakah sudah diinstal (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      // Fallback jika browser menolak memunculkan prompt (seperti di iOS atau Chrome Incognito)
      alert("Cara Manual Menginstal Aplikasi:\n\n📱 Di Android (Chrome):\nKetuk ikon 3 titik di pojok kanan atas, lalu pilih 'Tambahkan ke Layar Utama' (Add to Home screen).\n\n🍎 Di iPhone (Safari):\nKetuk tombol Share (Bagikan) di bagian bawah layar, lalu pilih 'Tambahkan ke Layar Utama'.")
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs} mnt`
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-orange-600">STRAVA KLON</h1>
          <div className="flex items-center gap-4">
            {!isStandalone && (
              <button 
                onClick={handleInstallClick} 
                className="flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white shadow-md hover:bg-gray-800 cursor-pointer animate-pulse"
              >
                <Download size={16} /> Install App
              </button>
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Halo, {fullName}</span>
            <button onClick={logout} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-1.5 font-bold pb-2 border-b-2 transition ${activeTab === 'global' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Users size={18} /> Komunitas
            </button>
            <button 
              onClick={() => setActiveTab('me')}
              className={`flex items-center gap-1.5 font-bold pb-2 border-b-2 transition ${activeTab === 'me' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <User size={18} /> Saya
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 cursor-pointer">
            <Plus size={18} /> Catat Olahraga
          </button>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-sm text-gray-500">Memuat riwayat olahraga...</div>
        ) : activities.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <div className="rounded-full bg-orange-50 p-4 text-orange-600"><Activity size={32} /></div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">Belum ada aktivitas</h3>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {activities.map((act) => (
              <FeedItem 
                key={act.id} 
                act={act} 
                onClick={() => {
                  setSelectedActivity(act)
                  setIsDetailOpen(true)
                }} 
                formatDuration={formatDuration} 
              />
            ))}
          </div>
        )}
      </main>

      <RecordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchActivities} />
      
      {/* 4. PASANG DETAIL MODAL DI BAWAH DASHBOARD */}
      <DetailModal 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedActivity(null)
        }} 
        activity={selectedActivity} 
      />
    </div>
  )
}